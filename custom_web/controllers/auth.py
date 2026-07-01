from odoo import http
from odoo.http import request
from .utils import get_active_mahasiswa, get_active_dosen
import logging
import random

_logger = logging.getLogger(__name__)


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

        # Log OTP di console untuk simulasi lokal
        _logger.info("==================================================")
        _logger.info(f"RESET PASSWORD OTP FOR {email}: {otp}")
        _logger.info("==================================================")

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

        # Log OTP di console untuk simulasi lokal
        _logger.info("==================================================")
        _logger.info(f"RESEND RESET PASSWORD OTP FOR {email}: {otp}")
        _logger.info("==================================================")

        return {'success': True}

    @http.route('/lupa-password/reset', auth='public', website=True, type='http', methods=['POST'], csrf=True)
    def reset_password(self, **post):
        """Ubah password baru (Step 3)."""
        email = request.session.get('reset_email')
        user_model = request.session.get('reset_user_model')
        user_id = request.session.get('reset_user_id')
        otp_verified = request.session.get('reset_otp_verified')

        if not email or not user_model or not user_id or not otp_verified:
            return request.redirect('/lupa-password')

        password = post.get('password', '').strip()
        confirm_password = post.get('confirm_password', '').strip()

        if not password or len(password) < 6:
            return request.render('custom_web.lupa_password', {
                'error': 'Password minimal terdiri dari 6 karakter.',
                'success': False,
                'step': 3,
                'email': email,
            })

        if password != confirm_password:
            return request.render('custom_web.lupa_password', {
                'error': 'Password baru dan konfirmasi password tidak cocok.',
                'success': False,
                'step': 3,
                'email': email,
            })

        # Dapatkan record user
        user = request.env[user_model].sudo().browse(user_id)
        if not user.exists():
            return request.render('custom_web.lupa_password', {
                'error': 'User tidak ditemukan. Silakan ulangi proses.',
                'success': False,
                'step': 1,
                'email': None,
            })

        # Update password ( Mahasiswa write password dihash SHA-256 otomatis )
        user.write({'password': password})

        # Bersihkan session reset
        request.session.pop('reset_email', None)
        request.session.pop('reset_otp', None)
        request.session.pop('reset_user_model', None)
        request.session.pop('reset_user_id', None)
        request.session.pop('reset_otp_verified', None)

        return request.render('custom_web.lupa_password', {
            'error': None,
            'success': False,
            'step': 4,
            'email': None,
        })


