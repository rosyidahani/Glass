import json
import pytz
from datetime import datetime
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

    # =======================================================
    # API BACKEND TUGAS
    # =======================================================
    @http.route('/api/tugas/buat', type='http', auth='user', methods=['POST'], cors='*', csrf=False)
    def api_tugas_buat(self, **kw):
        try:
            body = json.loads(request.httprequest.data)
            dosen = get_active_dosen()
            if not dosen:
                return request.make_response(json.dumps({'status': 'error', 'message': 'Unauthorized'}), status=401)
            
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
            })

            return request.make_response(json.dumps({
                'status': 'success', 
                'data': {'id': tugas.id}
            }), headers=[('Content-Type', 'application/json')])
        except Exception as e:
            return request.make_response(json.dumps({'status': 'error', 'message': str(e)}), headers=[('Content-Type', 'application/json')])

    @http.route('/api/tugas/hapus', type='http', auth='user', methods=['POST'], cors='*', csrf=False)
    def api_tugas_hapus(self, **kw):
        try:
            body = json.loads(request.httprequest.data)
            tugas = request.env['tugas.tugas'].sudo().browse(int(body['tugas_id']))
            if tugas.exists():
                tugas.unlink()
            return request.make_response(json.dumps({'status': 'success'}), headers=[('Content-Type', 'application/json')])
        except Exception as e:
            return request.make_response(json.dumps({'status': 'error', 'message': str(e)}), headers=[('Content-Type', 'application/json')])

    @http.route('/api/tugas/detail/<int:tugas_id>', type='http', auth='user', methods=['GET'], cors='*', csrf=False)
    def api_tugas_detail(self, tugas_id, **kw):
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
                'file': sub.link_jawaban or 'Berkas ZIP',
                'type': sub.tipe_file or 'zip',
                'note': sub.catatan or '-',
                'grade': sub.nilai,
                'status': sub.status_penilaian
            })

        data = {
            'title': tugas.judul,
            'subject': tugas.mata_kuliah_id.nama,
            'type': tugas.jenis_tugas,
            'deadline': waktu_wib,
            'desc': tugas.deskripsi,
            'submissions': submissions
        }
        return request.make_response(json.dumps({'status': 'success', 'data': data}), headers=[('Content-Type', 'application/json')])

    @http.route('/api/tugas/nilai', type='http', auth='user', methods=['POST'], cors='*', csrf=False)
    def api_tugas_nilai(self, **kw):
        try:
            body = json.loads(request.httprequest.data)
            sub = request.env['tugas.pengumpulan'].sudo().browse(int(body['pengumpulan_id']))
            if sub.exists():
                sub.write({'nilai': int(body['nilai']), 'status_penilaian': 'graded'})
            return request.make_response(json.dumps({'status': 'success'}), headers=[('Content-Type', 'application/json')])
        except Exception as e:
            return request.make_response(json.dumps({'status': 'error', 'message': str(e)}), headers=[('Content-Type', 'application/json')])
