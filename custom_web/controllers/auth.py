from odoo import http
from odoo.http import request
from .utils import get_active_mahasiswa, get_active_dosen


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
        return request.render('custom_web.lupa_password', {
            'error': None,
            'success': False,
        })

    @http.route('/lupa-password', auth='public', website=True, type='http', methods=['POST'], csrf=True)
    def lupa_password_submit(self, **post):
        """Proses permintaan reset password berdasarkan email."""
        email = post.get('email', '').strip().lower()

        if not email:
            return request.render('custom_web.lupa_password', {
                'error': 'Alamat email wajib diisi.',
                'success': False,
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
            })

        # TODO: Kirim email reset password via mail server
        # Di sini nanti akan dihubungkan ke Odoo mail server
        # Contoh: request.env['mail.mail'].sudo().create({...}).send()

        return request.render('custom_web.lupa_password', {
            'error': None,
            'success': True,
            'email': email,
        })


