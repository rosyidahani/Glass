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

    @http.route('/presensi', auth='public', website=True, type='http')
    def presensi_select(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')

        sesi_obj = request.env['presensi.sesi'].sudo()
        sessions = sesi_obj.search([('status', 'in', ['open', 'closed'])], order='id desc')

        courses = []
        for s in sessions:
            # Check if student already checked in
            sudah = request.env['presensi.record'].sudo().search([
                ('sesi_id', '=', s.id),
                ('mahasiswa_id', '=', mahasiswa.id)
            ], limit=1)

            # Map the visual properties
            status = 'selesai' if (s.status == 'closed' or sudah) else s.tipe_kelas
            status_label = 'Selesai' if (s.status == 'closed' or sudah) else ('Online' if s.tipe_kelas == 'online' else 'Offline')
            color = 'gray' if status == 'selesai' else ('green' if status == 'online' else 'blue')

            courses.append({
                'id': s.id,
                'name': s.mata_kuliah,
                'status': status,
                'status_label': status_label,
                'color': color,
                'dosen': s.dosen_id.name or 'Dosen Pengajar',
                'jam': s.waktu_buka.strftime('%H:%M WIB') if s.waktu_buka else 'Jam Aktif',
                'ruang': s.name,
            })

        return request.render('custom_web.presensi_select', {
            'mahasiswa': mahasiswa,
            'courses': courses,
        })

    @http.route('/presensi/scan/<int:course_id>', auth='public', website=True, type='http')
    def presensi_scan(self, course_id, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')

        sesi = request.env['presensi.sesi'].sudo().browse(course_id)
        if not sesi.exists():
            return request.redirect('/presensi')

        # Cek jika sudah pernah presensi atau sesi ditutup
        sudah = request.env['presensi.record'].sudo().search([
            ('sesi_id', '=', sesi.id),
            ('mahasiswa_id', '=', mahasiswa.id)
        ], limit=1)
        if sudah or sesi.status == 'closed':
            return request.redirect('/presensi')

        course = {
            'id': sesi.id,
            'name': sesi.mata_kuliah,
            'status': sesi.tipe_kelas,
            'dosen': sesi.dosen_id.name or 'Dosen Pengajar',
            'ruang': sesi.name,
        }

        return request.render('custom_web.presensi_scan', {
            'mahasiswa': mahasiswa,
            'course': course,
        })

