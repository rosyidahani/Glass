import base64
from odoo import http
from odoo.http import request
from .utils import get_active_mahasiswa


class MahasiswaPortalController(http.Controller):

    @http.route('/dashboard/mahasiswa', auth='public', website=True, type='http')
    def dashboard_mahasiswa(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')

        return request.render('custom_web.dashboard', {
            'mahasiswa': mahasiswa,
        })

    @http.route('/dashboard/mahasiswa/profile', auth='public', website=True, type='http')
    def profile_mahasiswa(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')

        return request.render('custom_web.profile', {
            'mahasiswa': mahasiswa,
        })

    @http.route('/dashboard/mahasiswa/profile/upload_photo', auth='public', website=True, type='http', methods=['POST'], csrf=True)
    def upload_photo_mahasiswa(self, **post):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')

        foto_profil = post.get('foto_profil')
        if foto_profil and foto_profil.filename:
            file_content = foto_profil.read()
            mahasiswa.sudo().write({
                'foto_profil': base64.b64encode(file_content)
            })

        return request.redirect('/dashboard/mahasiswa/profile')

    @http.route('/menu', auth='public', website=True, type='http')
    def menu(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')
            
        return request.render('custom_web.menu', {
            'mahasiswa_name': mahasiswa.name,
        })

    @http.route('/menu/submenu', auth='public', website=True, type='http')
    def submenu(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')
            
        return request.render('custom_web.submenu', {
            'mahasiswa_name': mahasiswa.name,
        })
