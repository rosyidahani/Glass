from odoo import http
from odoo.http import request
from .utils import get_active_mahasiswa, get_active_dosen
import logging
import random

_logger = logging.getLogger(__name__)


def _send_otp_email(env, to_email, otp_code, user_name=''):
    """Kirim email OTP menggunakan Odoo mail.mail.
    Returns True jika berhasil, False jika gagal."""
    try:
        subject = 'Kode OTP Reset Password - Glass Presence'
        body_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; 
                    border: 1px solid #e0e0e0; border-radius: 8px; background: #ffffff;">
            <h2 style="color: #1a1a2e; margin-bottom: 8px;">Reset Password</h2>
            <p style="color: #555; font-size: 14px;">Halo{' <strong>' + user_name + '</strong>' if user_name else ''},</p>
            <p style="color: #555; font-size: 14px;">
                Kami menerima permintaan reset password untuk akun Anda.
                Gunakan kode OTP di bawah ini untuk melanjutkan:
            </p>
            <div style="text-align: center; margin: 24px 0;">
                <div style="display: inline-block; background: #f0f4ff; border: 2px dashed #4a6cf7;
                            border-radius: 12px; padding: 16px 32px;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; 
                                 color: #4a6cf7;">{otp_code}</span>
                </div>
            </div>
            <p style="color: #555; font-size: 13px;">Kode ini berlaku selama <strong>10 menit</strong>.</p>
            <p style="color: #999; font-size: 12px;">
                Jika Anda tidak meminta reset password, abaikan email ini.
                Akun Anda tetap aman.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;"/>
            <p style="color: #bbb; font-size: 11px; text-align: center;">Glass Presence System</p>
        </div>
        """

        mail_values = {
            'subject': subject,
            'body_html': body_html,
            'email_to': to_email,
            'email_from': env['ir.config_parameter'].sudo().get_param(
                'mail.catchall.email', 'noreply@glass.local'
            ),
            'auto_delete': True,
        }
        mail = env['mail.mail'].sudo().create(mail_values)
        mail.send()
        _logger.info(f"[OTP] Email OTP berhasil dikirim ke {to_email}")
        return True
    except Exception as e:
        _logger.error(f"[OTP] Gagal mengirim email OTP ke {to_email}: {e}")
        return False


class AuthController(http.Controller):

    @http.route('/login', auth='public', website=True, type='http', methods=['GET'])
    def login_page(self, **kwargs):
        """Show the custom login page."""
        # If already logged in, redirect to respective dashboard
        mhs = get_active_mahasiswa()
        if mhs:
            if not mhs.face_descriptor:
                return request.redirect('/mahasiswa/register-face')
            return request.redirect('/dashboard/mahasiswa')
        if get_active_dosen():
            return request.redirect('/dashboard/dosen')
        return request.render('custom_web.login', {'error': None, 'role': 'mahasiswa'})

    @http.route('/login', auth='public', website=True, type='http', methods=['POST'], csrf=True)
    def login_submit(self, **post):
        """Handle login form submission for both roles."""
        role = post.get('role', 'mahasiswa')
        nim = post.get('nim', '').strip()
        password = post.get('password', '').strip()

        if not nim or not password:
            return request.render('custom_web.login', {
                'error': f"{'NIP' if role == 'dosen' else 'NIM'} dan Password wajib diisi.",
                'role': role
            })

        if role == 'mahasiswa':
            Mahasiswa = request.env['mahasiswa.mahasiswa'].sudo()
            mahasiswa = Mahasiswa.authenticate_nim(nim, password)

            if mahasiswa:
                request.session['mahasiswa_id'] = mahasiswa.id
                request.session['mahasiswa_nim'] = mahasiswa.nim
                request.session['mahasiswa_name'] = mahasiswa.name
                if not mahasiswa.face_descriptor:
                    return request.redirect('/mahasiswa/register-face')
                return request.redirect('/dashboard/mahasiswa')
            else:
                return request.render('custom_web.login', {
                    'error': 'NIM atau Password salah.',
                    'role': role
                })
        elif role == 'dosen':
            Dosen = request.env['feature.dosen'].sudo()
            dosen = Dosen.authenticate_nip(nim, password)

            if dosen:
                request.session['dosen_id'] = dosen.id
                request.session['dosen_nip'] = dosen.nip
                request.session['dosen_name'] = dosen.name
                return request.redirect('/dashboard/dosen')
            else:
                return request.render('custom_web.login', {
                    'error': 'NIP atau Password salah.',
                    'role': role
                })

    @http.route('/logout', auth='public', website=True, type='http')
    def logout(self, **kwargs):
        """Clear session and redirect to login."""
        request.session.pop('mahasiswa_id', None)
        request.session.pop('mahasiswa_nim', None)
        request.session.pop('mahasiswa_name', None)
        request.session.pop('dosen_id', None)
        request.session.pop('dosen_nip', None)
        request.session.pop('dosen_name', None)
        return request.redirect('/login')

    # ================================================
    # LUPA PASSWORD
    # ================================================
    @http.route('/lupa-password', auth='public', website=True, type='http', methods=['GET'])
    def lupa_password_page(self, **kwargs):
        """Tampilkan halaman lupa password."""
        # Bersihkan session reset sebelumnya
        request.session.pop('reset_email', None)
        request.session.pop('reset_otp', None)
        request.session.pop('reset_user_model', None)
        request.session.pop('reset_user_id', None)
        request.session.pop('reset_otp_verified', None)

        return request.render('custom_web.lupa_password', {
            'error': None,
            'success': False,
            'step': 1,
            'email': None,
        })

    @http.route('/lupa-password', auth='public', website=True, type='http', methods=['POST'], csrf=True)
    def lupa_password_submit(self, **post):
        """Proses permintaan reset password berdasarkan email (Step 1)."""
        email = post.get('email', '').strip().lower()

        if not email:
            return request.render('custom_web.lupa_password', {
                'error': 'Alamat email wajib diisi.',
                'success': False,
                'step': 1,
                'email': None,
            })

        # Cek apakah email terdaftar (mahasiswa atau dosen)
        mahasiswa = request.env['mahasiswa.mahasiswa'].sudo().search(
            [('email', '=', email), ('active', '=', True)], limit=1
        )
        dosen = request.env['feature.dosen'].sudo().search(
            [('email', '=', email)], limit=1
        )

        if not mahasiswa and not dosen:
            return request.render('custom_web.lupa_password', {
                'error': 'Email tidak ditemukan. Pastikan email yang Anda masukkan sudah terdaftar.',
                'success': False,
                'step': 1,
                'email': email,
            })

        # Generasi OTP 6-digit
        otp = str(random.randint(100000, 999999))

        # Simpan ke session
        request.session['reset_email'] = email
        request.session['reset_otp'] = otp
        request.session['reset_user_model'] = 'mahasiswa.mahasiswa' if mahasiswa else 'feature.dosen'
        request.session['reset_user_id'] = mahasiswa.id if mahasiswa else dosen.id
        request.session['reset_otp_verified'] = False

        # Ambil nama user untuk personalisasi email
        user_name = ''
        if mahasiswa:
            user_name = mahasiswa.name or ''
        elif dosen:
            user_name = dosen.name or ''

        # Kirim OTP via email
        email_sent = _send_otp_email(request.env, email, otp, user_name)

        # Log OTP di console sebagai backup
        _logger.info("==================================================")
        _logger.info(f"RESET PASSWORD OTP FOR {email}: {otp} (email_sent={email_sent})")
        _logger.info("==================================================")

        if not email_sent:
            return request.render('custom_web.lupa_password', {
                'error': 'Gagal mengirim email OTP. Pastikan server email sudah dikonfigurasi di Odoo Settings.',
                'success': False,
                'step': 1,
                'email': email,
            })

        return request.render('custom_web.lupa_password', {
            'error': None,
            'success': True,
            'step': 2,
            'email': email,
        })

    @http.route('/lupa-password/verify-otp', auth='public', website=True, type='http', methods=['POST'], csrf=True)
    def verify_otp(self, **post):
        """Validasi kode OTP yang dimasukkan (Step 2)."""
        email = request.session.get('reset_email')
        saved_otp = request.session.get('reset_otp')
        user_model = request.session.get('reset_user_model')
        user_id = request.session.get('reset_user_id')

        if not email or not saved_otp or not user_model or not user_id:
            return request.redirect('/lupa-password')

        otp_code = post.get('otp_code', '').strip()

        if not otp_code or otp_code != saved_otp:
            return request.render('custom_web.lupa_password', {
                'error': 'Kode OTP salah atau tidak cocok. Silakan periksa kembali.',
                'success': False,
                'step': 2,
                'email': email,
            })

        # Tandai OTP telah diverifikasi
        request.session['reset_otp_verified'] = True

        return request.render('custom_web.lupa_password', {
            'error': None,
            'success': False,
            'step': 3,
            'email': email,
        })

    @http.route('/lupa-password/resend-otp', auth='public', type='json', methods=['POST'], csrf=True)
    def resend_otp(self):
        """Kirim ulang OTP secara asinkron (AJAX)."""
        email = request.session.get('reset_email')
        user_model = request.session.get('reset_user_model')
        user_id = request.session.get('reset_user_id')

        if not email or not user_model or not user_id:
            return {'success': False, 'message': 'Sesi telah berakhir. Silakan ulangi dari awal.'}

        # Generasi OTP baru
        otp = str(random.randint(100000, 999999))
        request.session['reset_otp'] = otp

        # Ambil nama user
        user_name = ''
        try:
            user = request.env[user_model].sudo().browse(user_id)
            if user.exists():
                user_name = user.name or ''
        except Exception:
            pass

        # Kirim OTP via email
        email_sent = _send_otp_email(request.env, email, otp, user_name)

        # Log OTP di console sebagai backup
        _logger.info("==================================================")
        _logger.info(f"RESEND RESET PASSWORD OTP FOR {email}: {otp} (email_sent={email_sent})")
        _logger.info("==================================================")

        if not email_sent:
            return {'success': False, 'message': 'Gagal mengirim ulang email OTP. Cek konfigurasi server email.'}

        return {'success': True}

    @http.route('/lupa-password/reset', auth='public', website=True, type='http', methods=['POST'], csrf=True)
    def reset_password(self, **post):
        """Ubah password baru (Step 3)."""
        email = request.session.get('reset_email')
        user_model = request.session.get('reset_user_model')
        user_id = request.session.get('reset_user_id')
        otp_verified = request.session.get('reset_otp_verified')

        _logger.info("=== RESET PASSWORD SUBMIT ===")
        _logger.info(f"Session info - email: {email}, model: {user_model}, id: {user_id}, verified: {otp_verified}")
        _logger.info(f"POST params: {post}")

        if not email or not user_model or not user_id or not otp_verified:
            _logger.warning("Reset verification failed - session variables missing or invalid. Redirecting to /lupa-password")
            return request.redirect('/lupa-password')

        password = post.get('new_password', '').strip()
        confirm_password = post.get('confirm_password', '').strip()

        _logger.info(f"Passwords - len(new): {len(password)}, len(confirm): {len(confirm_password)}")

        if not password or len(password) < 6:
            _logger.warning("Password too short error")
            return request.render('custom_web.lupa_password', {
                'error': 'Password minimal terdiri dari 6 karakter.',
                'success': False,
                'step': 3,
                'email': email,
            })

        if password != confirm_password:
            _logger.warning("Passwords do not match error")
            return request.render('custom_web.lupa_password', {
                'error': 'Password baru dan konfirmasi password tidak cocok.',
                'success': False,
                'step': 3,
                'email': email,
            })

        # Dapatkan record user
        user = request.env[user_model].sudo().browse(user_id)
        if not user.exists():
            _logger.error(f"User with ID {user_id} in model {user_model} does not exist!")
            return request.render('custom_web.lupa_password', {
                'error': 'User tidak ditemukan. Silakan ulangi proses.',
                'success': False,
                'step': 1,
                'email': None,
            })

        # Update password ( Mahasiswa write password dihash SHA-256 otomatis )
        _logger.info(f"Updating password for user ID {user_id}...")
        try:
            user.write({'password': password})
            _logger.info("Password write successful in DB!")
        except Exception as write_err:
            _logger.error(f"Error writing password to database: {write_err}")
            return request.render('custom_web.lupa_password', {
                'error': f'Gagal menyimpan password ke database: {write_err}',
                'success': False,
                'step': 3,
                'email': email,
            })

        # Bersihkan session reset
        request.session.pop('reset_email', None)
        request.session.pop('reset_otp', None)
        request.session.pop('reset_user_model', None)
        request.session.pop('reset_user_id', None)
        request.session.pop('reset_otp_verified', None)
        _logger.info("Session reset parameters cleared.")

        return request.render('custom_web.lupa_password', {
            'error': None,
            'success': False,
            'step': 4,
            'email': None,
        })



