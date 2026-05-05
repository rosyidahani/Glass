from odoo import http
from odoo.http import request


class CustomWeb(http.Controller):

    @http.route('/login', auth='public', website=True, type='http', methods=['GET'])
    def login_page(self, **kwargs):
        """Show the custom login page."""
        # If already logged in as mahasiswa, redirect to dashboard
        if request.session.get('mahasiswa_id'):
            return request.redirect('/dashboard')
        return request.render('custom_web.login', {'error': None})

    @http.route('/login', auth='public', website=True, type='http', methods=['POST'], csrf=True)
    def login_submit(self, **post):
        """Handle NIM login form submission."""
        nim = post.get('nim', '').strip()
        password = post.get('password', '').strip()

        if not nim or not password:
            return request.render('custom_web.login', {
                'error': 'NIM dan Password wajib diisi.',
            })

        Mahasiswa = request.env['mahasiswa.mahasiswa'].sudo()
        mahasiswa = Mahasiswa.authenticate_nim(nim, password)

        if mahasiswa:
            # Store mahasiswa info in session
            request.session['mahasiswa_id'] = mahasiswa.id
            request.session['mahasiswa_nim'] = mahasiswa.nim
            request.session['mahasiswa_name'] = mahasiswa.name
            return request.redirect('/dashboard')
        else:
            return request.render('custom_web.login', {
                'error': 'NIM atau Password salah.',
            })

    @http.route('/logout', auth='public', website=True, type='http')
    def logout(self, **kwargs):
        """Clear mahasiswa session and redirect to login."""
        request.session.pop('mahasiswa_id', None)
        request.session.pop('mahasiswa_nim', None)
        request.session.pop('mahasiswa_name', None)
        return request.redirect('/login')

    @http.route('/dashboard', auth='public', website=True, type='http')
    def dashboard(self, **kwargs):
        mahasiswa_id = request.session.get('mahasiswa_id')
        if not mahasiswa_id:
            return request.redirect('/login')
            
        mahasiswa = request.env['mahasiswa.mahasiswa'].sudo().browse(mahasiswa_id)
        if not mahasiswa.exists():
            request.session.pop('mahasiswa_id', None)
            return request.redirect('/login')
            
        return request.render('custom_web.dashboard', {
            'mahasiswa': mahasiswa,
        })

    @http.route('/menu', auth='public', website=True, type='http')
    def menu(self, **kwargs):
        if not request.session.get('mahasiswa_id'):
            return request.redirect('/login')
        return request.render('custom_web.menu', {
            'mahasiswa_name': request.session.get('mahasiswa_name', ''),
        })

    @http.route('/menu/submenu', auth='public', website=True, type='http')
    def submenu(self, **kwargs):
        if not request.session.get('mahasiswa_id'):
            return request.redirect('/login')
        return request.render('custom_web.submenu', {
            'mahasiswa_name': request.session.get('mahasiswa_name', ''),
        })