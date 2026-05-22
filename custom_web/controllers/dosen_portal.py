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
