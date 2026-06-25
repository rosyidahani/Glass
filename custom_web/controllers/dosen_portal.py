import json
import pytz
from datetime import datetime
from odoo import http
import base64
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

    @http.route([
        '/dashboard/dosen/settings',
        '/dashboard/dosen/settings/<int:submenu_id>'
    ], auth='public', website=True, type='http')
    def settings_dosen(self, submenu_id=None, **kwargs):
        dosen = get_active_dosen()
        if not dosen:
            return request.redirect('/login')

        return request.render('custom_web.settings_dosen', {
            'dosen': dosen,
        })

    @http.route('/dosen/presensi', auth='public', website=True, type='http')
    def presensi_dosen_menu(self, **kwargs):
        dosen = get_active_dosen()
        if not dosen:
            return request.redirect('/login')
        return request.render('custom_web.presensi_dosen_menu', {
            'dosen': dosen,
        })

    @http.route('/dosen/presensi/buat', auth='public', website=True, type='http')
    def presensi_dosen_buat(self, **kwargs):
        dosen = get_active_dosen()
        if not dosen:
            return request.redirect('/login')

        sesi_obj = request.env['presensi.sesi'].sudo()
        open_sessions = sesi_obj.search([('status', '=', 'open'), ('feature_dosen_id', '=', dosen.id)], order='id desc')

        # Load courses specifically taught by this Dosen
        courses_list = request.env['mata.kuliah'].sudo().search([('dosen_id', '=', dosen.id)], order='nama asc')
        if not courses_list:
            # Fallback to all active courses if no relationship is defined yet
            courses_list = request.env['mata.kuliah'].sudo().search([], order='nama asc')

        return request.render('custom_web.presensi_dosen_buat', {
            'dosen': dosen,
            'open_sessions': open_sessions,
            'courses_list': courses_list,
        })

    @http.route('/dosen/presensi/histori', auth='public', website=True, type='http')
    def presensi_dosen_histori(self, **kwargs):
        dosen = get_active_dosen()
        if not dosen:
            return request.redirect('/login')

        sesi_obj = request.env['presensi.sesi'].sudo()
        closed_sessions = sesi_obj.search([('status', '=', 'closed'), ('feature_dosen_id', '=', dosen.id)], order='id desc')

        return request.render('custom_web.presensi_dosen_histori', {
            'dosen': dosen,
            'closed_sessions': closed_sessions,
        })

    @http.route('/dosen/presensi/histori/detail/<int:sesi_id>', auth='public', website=True, type='http')
    def presensi_dosen_histori_detail(self, sesi_id, **kwargs):
        dosen = get_active_dosen()
        if not dosen:
            return request.redirect('/login')

        sesi = request.env['presensi.sesi'].sudo().browse(sesi_id)
        if not sesi.exists() or sesi.feature_dosen_id.id != dosen.id:
            return request.redirect('/dosen/presensi/histori')

        # Get all records for this session, sorted by check-in time
        records = sesi.record_ids.sorted(key=lambda r: r.waktu_presensi)

        return request.render('custom_web.presensi_dosen_histori_detail', {
            'dosen': dosen,
            'sesi': sesi,
            'records': records,
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
        
        # Fetch real assignments created for these courses
        mk_ids = [mk.id for mk in real_mk]
        tugas_list = request.env['tugas.tugas'].sudo().search([('mata_kuliah_id', 'in', mk_ids)], order='create_date desc')
        
        tugas_data = []
        for t in tugas_list:
            count = len(t.pengumpulan_ids)
            color = 'purple'
            if 'web' in t.mata_kuliah_id.nama.lower():
                color = 'blue'
            elif 'rekayasa' in t.mata_kuliah_id.nama.lower():
                color = 'teal'
            
            tugas_data.append({
                'id': t.id,
                'judul': t.judul,
                'mk_id': t.mata_kuliah_id.id,
                'mk_nama': t.mata_kuliah_id.nama,
                'jenis_tugas': t.jenis_tugas,
                'submission_count': count,
                'color': color,
            })

        return request.render('custom_web.tugas_dosen_pengumpulan', {
            'dosen': dosen,
            'mata_kuliah': mata_kuliah,
            'tugas_data': tugas_data,
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

    # =======================================================
    # LEADERBOARD DOSEN (VIEW ONLY)
    # =======================================================
    @http.route('/dosen/leaderboard', auth='public', website=True, type='http')
    def dosen_leaderboard(self, **kwargs):
        dosen = get_active_dosen()
        if not dosen:
            return request.redirect('/login')

        prodi = getattr(dosen, 'prodi', False) if hasattr(dosen, 'prodi') else False
        if not prodi:
            prodi = ''

        # Ambil list angkatan dari semua mahasiswa di prodi ini
        base_domain = [('active', '=', True)]
        if prodi:
            base_domain.append(('prodi', '=', prodi))

        all_prodi_students = request.env['mahasiswa.mahasiswa'].sudo().search(base_domain)

        # Ambil NIM 2 digit awal yang valid (berupa angka)
        angkatan_set = sorted({
            (s.nim or '')[:2] 
            for s in all_prodi_students 
            if (s.nim or '').strip() and len((s.nim or '').strip()) >= 2 and (s.nim or '')[:2].isdigit()
        })

        angkatan_selected = kwargs.get('angkatan') or 'semua'

        # Query mahasiswa untuk leaderboard berdasarkan prodi dan angkatan terpilih
        students_domain = [('active', '=', True)]
        if prodi:
            students_domain.append(('prodi', '=', prodi))

        if angkatan_selected and angkatan_selected != 'semua':
            students_domain.append(('nim', '=like', f"{angkatan_selected}%"))

        students_for_template = request.env['mahasiswa.mahasiswa'].sudo().search(students_domain, order='total_xp desc')

        return request.render('custom_web.leaderboard_dosen', {
            'dosen': dosen,
            'prodi_id': prodi,
            'prodi_name': prodi or 'Nama Prodi',
            'angkatan_list': angkatan_set,
            'angkatan_selected': angkatan_selected,
            'students': students_for_template,
        })


    # =======================================================
    # API BACKEND TUGAS
    # =======================================================
    @http.route('/api/tugas/buat', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def api_tugas_buat(self, **kw):
        try:
            dosen = get_active_dosen()
            if not dosen:
                return request.make_response(json.dumps({'status': 'error', 'message': 'Unauthorized'}), status=401)
            
            body = json.loads(request.httprequest.data)
            
            # Konversi format JS (YYYY-MM-DDTHH:MM) ke UTC Odoo
            dt_str = body['deadline'].replace('T', ' ')
            if len(dt_str) == 16:
                dt_str += ':00'
            local_dt = datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S')
            local_tz = pytz.timezone('Asia/Jakarta')
            utc_dt = local_tz.localize(local_dt).astimezone(pytz.utc)

            tugas = request.env['tugas.tugas'].sudo().create({
                'judul': body['judul'],
                'mata_kuliah_id': int(body['mk_id']),
                'dosen_id': dosen.id,
                'jenis_tugas': body['jenis_tugas'],
                'deskripsi': body['deskripsi'],
                'deadline': utc_dt.strftime('%Y-%m-%d %H:%M:%S'),
                'file_materi': body.get('file_materi'),
                'file_materi_name': body.get('file_materi_name'),
            })

            return request.make_response(json.dumps({
                'status': 'success', 
                'data': {'id': tugas.id}
            }), headers=[('Content-Type', 'application/json')])
        except Exception as e:
            return request.make_response(json.dumps({'status': 'error', 'message': str(e)}), headers=[('Content-Type', 'application/json')])

    @http.route('/api/tugas/hapus', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def api_tugas_hapus(self, **kw):
        try:
            dosen = get_active_dosen()
            if not dosen:
                return request.make_response(json.dumps({'status': 'error', 'message': 'Unauthorized'}), status=401)

            body = json.loads(request.httprequest.data)
            tugas = request.env['tugas.tugas'].sudo().browse(int(body['tugas_id']))
            if tugas.exists():
                tugas.unlink()
            return request.make_response(json.dumps({'status': 'success'}), headers=[('Content-Type', 'application/json')])
        except Exception as e:
            return request.make_response(json.dumps({'status': 'error', 'message': str(e)}), headers=[('Content-Type', 'application/json')])

    @http.route('/api/tugas/detail/<int:tugas_id>', type='http', auth='public', methods=['GET'], cors='*', csrf=False)
    def api_tugas_detail(self, tugas_id, **kw):
        dosen = get_active_dosen()
        if not dosen:
            return request.make_response(json.dumps({'status': 'error', 'message': 'Unauthorized'}), status=401)

        tugas = request.env['tugas.tugas'].sudo().browse(tugas_id)
        if not tugas.exists():
            return request.make_response(json.dumps({'status': 'error', 'message': 'Tugas tidak ditemukan'}), headers=[('Content-Type', 'application/json')])

        local_tz = pytz.timezone('Asia/Jakarta')
        waktu_wib = pytz.utc.localize(tugas.deadline).astimezone(local_tz).strftime('%d %b %Y, %H:%M WIB') if tugas.deadline else '-'

        submissions = []
        for sub in tugas.pengumpulan_ids:
            sub_wib = pytz.utc.localize(sub.waktu_kumpul).astimezone(local_tz).strftime('%d %b %Y, %H:%M WIB') if sub.waktu_kumpul else '-'
            submissions.append({
                'id': sub.id,
                'name': sub.mahasiswa_id.name,
                'nim': sub.mahasiswa_id.nim,
                'date': sub_wib,
                'file': f'/api/tugas/pengumpulan/download/{sub.id}' if sub.file_jawaban else sub.link_jawaban,
                'type': 'zip' if sub.file_jawaban else 'link',
                'note': sub.catatan or '-',
                'grade': sub.nilai,
                'status': sub.status_penilaian
            })

        data = {
            'id': tugas.id,
            'title': tugas.judul,
            'subject': tugas.mata_kuliah_id.nama,
            'type': tugas.jenis_tugas,
            'deadline': waktu_wib,
            'desc': tugas.deskripsi,
            'file_materi_name': tugas.file_materi_name or '',
            'has_file_materi': bool(tugas.file_materi),
            'file_materi_url': f'/dosen/tugas/materi/{tugas.id}' if tugas.file_materi else '',
            'submissions': submissions
        }
        return request.make_response(json.dumps({'status': 'success', 'data': data}), headers=[('Content-Type', 'application/json')])

    @http.route('/api/tugas/nilai', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def api_tugas_nilai(self, **kw):
        try:
            dosen = get_active_dosen()
            if not dosen:
                return request.make_response(json.dumps({'status': 'error', 'message': 'Unauthorized'}), status=401)

            body = json.loads(request.httprequest.data)
            sub = request.env['tugas.pengumpulan'].sudo().browse(int(body['pengumpulan_id']))
            if sub.exists():
                sub.write({'nilai': int(body['nilai']), 'status_penilaian': 'graded'})
            return request.make_response(json.dumps({'status': 'success'}), headers=[('Content-Type', 'application/json')])
        except Exception as e:
            return request.make_response(json.dumps({'status': 'error', 'message': str(e)}), headers=[('Content-Type', 'application/json')])

    @http.route('/api/tugas/pengumpulan/download/<int:pengumpulan_id>', type='http', auth='public', methods=['GET'])
    def api_tugas_download_jawaban(self, pengumpulan_id, **kw):
        dosen = get_active_dosen()
        if not dosen:
            return request.make_response("Unauthorized", status=401)

        submission = request.env['tugas.pengumpulan'].sudo().browse(pengumpulan_id)
        if not submission.exists() or not submission.file_jawaban:
            return request.not_found("File tidak ditemukan atau pengumpulan tidak valid.")

        file_data = base64.b64decode(submission.file_jawaban)
        
        # Sanitize filename
        tugas_judul = ''.join(c for c in submission.tugas_id.judul if c.isalnum() or c in (' ', '_')).rstrip()
        mhs_nim = submission.mahasiswa_id.nim or "000"
        filename = f"jawaban_{mhs_nim}_{tugas_judul}.zip"

        return request.make_response(file_data, headers=[
            ('Content-Type', 'application/zip'),
            ('Content-Disposition', f'attachment; filename="{filename}"')
        ])

    @http.route('/dosen/tugas/materi/<int:tugas_id>', auth='public', website=True, type='http')
    def download_tugas_materi(self, tugas_id, **kwargs):
        tugas = request.env['tugas.tugas'].sudo().browse(tugas_id)
        if not tugas.exists() or not tugas.file_materi:
            return request.not_found()
        
        import base64
        file_data = base64.b64decode(tugas.file_materi)
        filename = tugas.file_materi_name or f"materi_tugas_{tugas_id}"
        
        return request.make_response(file_data, headers=[
            ('Content-Type', 'application/octet-stream'),
            ('Content-Disposition', f'attachment; filename="{filename}"')
        ])