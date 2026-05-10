from odoo import http
from odoo.http import request


class CustomWeb(http.Controller):

    @http.route('/login', auth='public', website=True, type='http', methods=['GET'])
    def login_page(self, **kwargs):
        """Show the custom login page."""
<<<<<<< HEAD
        # If already logged in, redirect to respective dashboard
        if request.session.get('mahasiswa_id'):
            return request.redirect('/dashboard/mahasiswa')
        if request.session.get('dosen_id'):
            return request.redirect('/dashboard/dosen')
        return request.render('custom_web.login', {'error': None, 'role': 'mahasiswa'})

    @http.route('/login', auth='public', website=True, type='http', methods=['POST'], csrf=True)
    def login_submit(self, **post):
        """Handle login form submission for both roles."""
        role = post.get('role', 'mahasiswa')
=======
        # If already logged in as mahasiswa, redirect to dashboard
        if request.session.get('mahasiswa_id'):
            return request.redirect('/dashboard')
        return request.render('custom_web.login', {'error': None})

    @http.route('/login', auth='public', website=True, type='http', methods=['POST'], csrf=True)
    def login_submit(self, **post):
        """Handle NIM login form submission."""
>>>>>>> a7fb560f2b89bac0588d027908ef36e3540408bd
        nim = post.get('nim', '').strip()
        password = post.get('password', '').strip()

        if not nim or not password:
            return request.render('custom_web.login', {
<<<<<<< HEAD
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

    @http.route('/dashboard', auth='public', website=True, type='http')
    def dashboard_redirect(self, **kwargs):
        """Redirect generic /dashboard to the correct role dashboard."""
        if request.session.get('mahasiswa_id'):
            return request.redirect('/dashboard/mahasiswa')
        elif request.session.get('dosen_id'):
            return request.redirect('/dashboard/dosen')
        return request.redirect('/login')

    @http.route('/dashboard/mahasiswa', auth='public', website=True, type='http')
    def dashboard_mahasiswa(self, **kwargs):
=======
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
>>>>>>> a7fb560f2b89bac0588d027908ef36e3540408bd
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

<<<<<<< HEAD
    @http.route('/dashboard/dosen', auth='public', website=True, type='http')
    def dashboard_dosen(self, **kwargs):
        dosen_id = request.session.get('dosen_id')
        if not dosen_id:
            return request.redirect('/login')
            
        dosen = request.env['feature.dosen'].sudo().browse(dosen_id)
        if not dosen.exists():
            request.session.pop('dosen_id', None)
            return request.redirect('/login')
            
        return request.render('custom_web.dashboard_dosen', {
            'dosen': dosen,
        })

=======
>>>>>>> a7fb560f2b89bac0588d027908ef36e3540408bd
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