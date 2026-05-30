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

        # Ambil seluruh mata kuliah yang diambil mahasiswa
        courses_taken = mahasiswa.mata_kuliah_ids

        courses = []
        for course in courses_taken:
            # Cari jika ada sesi presensi yang sedang terbuka untuk mata kuliah ini
            session = request.env['presensi.sesi'].sudo().search([
                ('mata_kuliah_id', '=', course.id),
                ('status', '=', 'open')
            ], limit=1, order='id desc')

            sudah = False
            if session:
                # Cek jika mahasiswa sudah melakukan presensi di sesi aktif ini
                sudah = request.env['presensi.record'].sudo().search([
                    ('sesi_id', '=', session.id),
                    ('mahasiswa_id', '=', mahasiswa.id)
                ], limit=1)

            if session:
                dosen_name = session.feature_dosen_id.name or session.dosen_id.name or course.dosen_pengampu or 'Dosen Pengajar'
                
                # Format UTC datetime to Asia/Jakarta (WIB) local time
                import pytz
                waktu_buka_wib = ''
                if session.waktu_buka:
                    waktu_buka_utc = pytz.utc.localize(session.waktu_buka)
                    waktu_buka_wib = waktu_buka_utc.astimezone(pytz.timezone('Asia/Jakarta')).strftime('%H:%M WIB')

                if sudah:
                    courses.append({
                        'id': session.id,
                        'name': course.nama,
                        'status': 'selesai',
                        'status_label': 'Selesai',
                        'action_label': 'Sudah Presensi',
                        'color': 'gray',
                        'dosen': dosen_name,
                        'jam': waktu_buka_wib or 'Selesai',
                        'ruang': session.name,
                    })
                else:
                    courses.append({
                        'id': session.id,
                        'name': course.nama,
                        'status': session.tipe_kelas,
                        'status_label': 'Online' if session.tipe_kelas == 'online' else 'Offline',
                        'action_label': 'Mulai Presensi',
                        'color': 'green' if session.tipe_kelas == 'online' else 'blue',
                        'dosen': dosen_name,
                        'jam': waktu_buka_wib or 'Jam Aktif',
                        'ruang': session.name,
                    })
            else:
                courses.append({
                    'id': 0,
                    'name': course.nama,
                    'status': 'selesai',
                    'status_label': 'Belum Ada Sesi',
                    'action_label': 'Belum Ada Sesi',
                    'color': 'gray',
                    'dosen': course.dosen_pengampu or 'Dosen Pengajar',
                    'jam': 'Belum Dibuka',
                    'ruang': '-',
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
            'name': sesi.mata_kuliah_id.nama or 'Mata Kuliah',
            'status': sesi.tipe_kelas,
            'dosen': sesi.dosen_id.name or 'Dosen Pengajar',
            'ruang': sesi.name,
        }

        return request.render('custom_web.presensi_scan', {
            'mahasiswa': mahasiswa,
            'course': course,
        })

