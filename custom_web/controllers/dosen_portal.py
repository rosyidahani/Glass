from odoo import http
from odoo.http import request
from .utils import get_active_mahasiswa, get_active_dosen


class DosenPortalController(http.Controller):

    @http.route('/dashboard', auth='public', website=True, type='http')
    def dashboard_redirect(self, **kwargs):
        """Redirect generic /dashboard to the correct role dashboard."""
        if get_active_mahasiswa():
            return request.redirect('/dashboard/mahasiswa')
        elif get_active_dosen():
            return request.redirect('/dashboard/dosen')
        return request.redirect('/login')

    @http.route('/dashboard/dosen', auth='public', website=True, type='http')
    def dashboard_dosen(self, **kwargs):
        dosen = get_active_dosen()
        if not dosen:
            return request.redirect('/login')

        return request.render('custom_web.dashboard_dosen', {
            'dosen': dosen,
        })

    @http.route('/dosen/presensi', auth='public', website=True, type='http')
    def presensi_dosen(self, **kwargs):
        dosen = get_active_dosen()
        if not dosen:
            return request.redirect('/login')

        sesi_obj = request.env['presensi.sesi'].sudo()
        open_sessions = sesi_obj.search([('status', '=', 'open'), ('feature_dosen_id', '=', dosen.id)], order='id desc')
        closed_sessions = sesi_obj.search([('status', '=', 'closed'), ('feature_dosen_id', '=', dosen.id)], order='id desc')

        # Load courses specifically taught by this Dosen
        courses_list = request.env['mata.kuliah'].sudo().search([('dosen_id', '=', dosen.id)], order='nama asc')
        if not courses_list:
            # Fallback to all active courses if no relationship is defined yet
            courses_list = request.env['mata.kuliah'].sudo().search([], order='nama asc')

        return request.render('custom_web.presensi_dosen', {
            'dosen': dosen,
            'open_sessions': open_sessions,
            'closed_sessions': closed_sessions,
            'courses_list': courses_list,
        })

    @http.route('/dosen/tugas', auth='public', website=True, type='http')
    def tugas_dosen_menu(self, **kwargs):
        dosen = get_active_dosen()
        if not dosen:
            return request.redirect('/login')
        return request.render('custom_web.tugas_dosen_menu', {
            'dosen': dosen,
        })

    @http.route('/dosen/tugas/buat', auth='public', website=True, type='http')
    def tugas_dosen_buat(self, **kwargs):
        dosen = get_active_dosen()
        if not dosen:
            return request.redirect('/login')

        # Get actual courses taught by this Dosen from database (removes mockup dummy data)
        real_mk = request.env['mata.kuliah'].sudo().search([('dosen_id', '=', dosen.id)], order='nama asc')
        if not real_mk:
            real_mk = request.env['mata.kuliah'].sudo().search([], order='nama asc')
        
        mata_kuliah = [{'id': mk.id, 'name': mk.nama} for mk in real_mk]

        return request.render('custom_web.tugas_dosen_buat', {
            'dosen': dosen,
            'mata_kuliah': mata_kuliah,
        })

    @http.route('/dosen/tugas/pengumpulan', auth='public', website=True, type='http')
    def tugas_dosen_pengumpulan(self, **kwargs):
        dosen = get_active_dosen()
        if not dosen:
            return request.redirect('/login')

        # Get actual courses taught by this Dosen from database (removes mockup dummy data)
        real_mk = request.env['mata.kuliah'].sudo().search([('dosen_id', '=', dosen.id)], order='nama asc')
        if not real_mk:
            real_mk = request.env['mata.kuliah'].sudo().search([], order='nama asc')
        
        mata_kuliah = [{'id': mk.id, 'name': mk.nama} for mk in real_mk]

        return request.render('custom_web.tugas_dosen_pengumpulan', {
            'dosen': dosen,
            'mata_kuliah': mata_kuliah,
        })

    @http.route('/dosen/tugas/detail/<string:tugas_id>', auth='public', website=True, type='http')
    def tugas_dosen_detail(self, tugas_id, **kwargs):
        dosen = get_active_dosen()
        if not dosen:
            return request.redirect('/login')

        return request.render('custom_web.tugas_dosen_detail', {
            'dosen': dosen,
            'tugas_id': tugas_id,
        })
