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
        open_sessions = sesi_obj.search([('status', '=', 'open')], order='id desc')
        closed_sessions = sesi_obj.search([('status', '=', 'closed')], order='id desc')

        return request.render('custom_web.presensi_dosen', {
            'dosen': dosen,
            'open_sessions': open_sessions,
            'closed_sessions': closed_sessions,
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

        # Mock mata kuliah options for Dosen
        mata_kuliah = [
            {'id': 1, 'name': 'Kecerdasan Buatan (AI)'},
            {'id': 2, 'name': 'Pemrograman Web II'},
            {'id': 3, 'name': 'Rekayasa Perangkat Lunak'},
            {'id': 4, 'name': 'Interaksi Manusia dan Komputer'}
        ]

        return request.render('custom_web.tugas_dosen_buat', {
            'dosen': dosen,
            'mata_kuliah': mata_kuliah,
        })

    @http.route('/dosen/tugas/pengumpulan', auth='public', website=True, type='http')
    def tugas_dosen_pengumpulan(self, **kwargs):
        dosen = get_active_dosen()
        if not dosen:
            return request.redirect('/login')

        mata_kuliah = [
            {'id': 1, 'name': 'Kecerdasan Buatan (AI)'},
            {'id': 2, 'name': 'Pemrograman Web II'},
            {'id': 3, 'name': 'Rekayasa Perangkat Lunak'},
            {'id': 4, 'name': 'Interaksi Manusia dan Komputer'}
        ]

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
