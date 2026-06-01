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

        # Get all tasks for the student's courses
        course_ids = mahasiswa.mata_kuliah_ids.ids
        tugas_obj = request.env['tugas.tugas'].sudo()
        tugas_list = tugas_obj.search([('mata_kuliah_id', 'in', course_ids)], order='deadline desc')
        
        # Map which ones have been submitted by this mahasiswa
        submissions = request.env['tugas.pengumpulan'].sudo().search([
            ('mahasiswa_id', '=', mahasiswa.id),
            ('tugas_id', 'in', tugas_list.ids)
        ])
        # Group submissions by tugas_id
        submission_by_tugas = {sub.tugas_id.id: sub for sub in submissions}
        
        import pytz
        from datetime import datetime
        now_utc = datetime.utcnow()
        
        tugas_aktif = []
        tugas_riwayat = []
        
        for t in tugas_list:
            sub = submission_by_tugas.get(t.id)
            
            wib = pytz.timezone('Asia/Jakarta')
            
            date_open_dt = t.create_date or datetime.utcnow()
            date_open_wib = pytz.utc.localize(date_open_dt).astimezone(wib)
            date_open_str = date_open_wib.strftime('%d %B %Y, %H:%M WIB')
            date_open_iso = date_open_wib.strftime('%Y-%m-%dT%H:%M:%S')
            
            deadline_dt = t.deadline
            deadline_wib = pytz.utc.localize(deadline_dt).astimezone(wib)
            deadline_str = deadline_wib.strftime('%d %B %Y, %H:%M WIB')
            deadline_iso = deadline_wib.strftime('%Y-%m-%dT%H:%M:%S')
            
            is_soon = False
            if not sub and t.deadline:
                delta = t.deadline - now_utc
                if 0 < delta.total_seconds() <= 86400: # 1 day
                    is_soon = True

            # Format Indonesian months
            months_id = {
                'January': 'Januari', 'February': 'Februari', 'March': 'Maret',
                'April': 'April', 'May': 'Mei', 'June': 'Juni',
                'July': 'Juli', 'August': 'Agustus', 'September': 'September',
                'October': 'Oktober', 'November': 'November', 'December': 'Desember'
            }
            for eng, ind in months_id.items():
                date_open_str = date_open_str.replace(eng, ind)
                deadline_str = deadline_str.replace(eng, ind)
            
            task_data = {
                'id': t.id,
                'name': t.judul,
                'subject': t.mata_kuliah_id.nama,
                'course_id': t.mata_kuliah_id.id,
                'jenis_tugas': t.jenis_tugas,
                'deskripsi': t.deskripsi or '',
                'date_open': date_open_str,
                'date_open_iso': date_open_iso,
                'date_close': deadline_str,
                'date_close_iso': deadline_iso,
                'is_soon': is_soon,
                'has_file_materi': bool(t.file_materi),
                'file_materi_name': t.file_materi_name or '',
                'file_materi_url': f'/dosen/tugas/materi/{t.id}' if t.file_materi else '',
            }
            
            if sub:
                task_data['status'] = 'completed'
                task_data['status_label'] = 'Selesai'
                task_data['nilai'] = sub.nilai
                task_data['status_penilaian'] = sub.status_penilaian
                tugas_riwayat.append(task_data)
            else:
                if t.deadline and now_utc > t.deadline:
                    task_data['status'] = 'missed'
                    task_data['status_label'] = 'Terlambat'
                    tugas_riwayat.append(task_data)
                else:
                    task_data['status'] = 'pending'
                    task_data['status_label'] = 'Belum Selesai'
                    tugas_aktif.append(task_data)
            
        return request.render('custom_web.menu', {
            'mahasiswa': mahasiswa,
            'mahasiswa_name': mahasiswa.name,
            'courses': mahasiswa.mata_kuliah_ids,
            'tugas_aktif': tugas_aktif,
            'tugas_riwayat': tugas_riwayat,
            'stats_active_count': len(tugas_aktif),
            'stats_history_count': len(tugas_riwayat),
        })

    @http.route('/api/tugas/kumpul', type='json', auth='public', methods=['POST'], cors='*', csrf=False)
    def api_tugas_kumpul(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return {'status': 'error', 'message': 'Session expired or not logged in'}

        from odoo import fields
        tugas_id = kwargs.get('tugas_id')
        tipe_file = kwargs.get('tipe_file')
        file_jawaban = kwargs.get('file_jawaban')
        link_jawaban = kwargs.get('link_jawaban')
        catatan = kwargs.get('catatan')

        if not tugas_id:
            return {'status': 'error', 'message': 'ID Tugas wajib diisi.'}

        tugas = request.env['tugas.tugas'].sudo().browse(int(tugas_id))
        if not tugas.exists():
            return {'status': 'error', 'message': 'Tugas tidak ditemukan.'}

        existing = request.env['tugas.pengumpulan'].sudo().search([
            ('tugas_id', '=', tugas.id),
            ('mahasiswa_id', '=', mahasiswa.id)
        ], limit=1)

        vals = {
            'tugas_id': tugas.id,
            'mahasiswa_id': mahasiswa.id,
            'tipe_file': tipe_file,
            'file_jawaban': file_jawaban or False,
            'link_jawaban': link_jawaban or '',
            'catatan': catatan or '',
            'waktu_kumpul': fields.Datetime.now()
        }

        if existing:
            existing.write(vals)
        else:
            request.env['tugas.pengumpulan'].sudo().create(vals)

        return {
            'status': 'success'
        }

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

            if session and not sudah:
                dosen_name = session.feature_dosen_id.name or session.dosen_id.name or course.dosen_pengampu or 'Dosen Pengajar'
                
                # Format UTC datetime to Asia/Jakarta (WIB) local time
                import pytz
                waktu_buka_wib = ''
                if session.waktu_buka:
                    waktu_buka_utc = pytz.utc.localize(session.waktu_buka)
                    waktu_buka_wib = waktu_buka_utc.astimezone(pytz.timezone('Asia/Jakarta')).strftime('%H:%M WIB')

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