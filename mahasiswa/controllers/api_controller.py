from odoo import http
from odoo.http import request
from odoo.exceptions import UserError
import json
import base64
from odoo import fields

class MahasiswaAPI(http.Controller):

    # ================================================
    # HELPER: format response seragam
    # ================================================
    def _success(self, data):
        return request.make_response(
            json.dumps({'status': 'success', 'data': data}),
            headers=[('Content-Type', 'application/json')]
        )

    def _error(self, message, status=400):
        return request.make_response(
            json.dumps({'status': 'error', 'message': message}),
            headers=[('Content-Type', 'application/json')],
            status=status
        )

    def _get_mahasiswa_from_session(self):
        """Ambil mahasiswa berdasarkan NIM yang disimpan di session."""
        nim = request.session.get('mahasiswa_nim')
        if not nim:
            return None
        return request.env['mahasiswa.mahasiswa'].sudo().search(
            [('nim', '=', nim), ('active', '=', True)], limit=1
        )

    # ================================================
    # ENDPOINT LOGIN: POST /api/auth/login
    # Mahasiswa login pakai NIM + password
    # ================================================
    @http.route('/api/auth/login', type='http',
                auth='public', methods=['POST'], cors='*', csrf=False)
    def login(self, **kw):
        try:
            body = json.loads(request.httprequest.data)
        except Exception:
            return self._error('Format request tidak valid, harus JSON.')

        nim = body.get('nim')
        password = body.get('password')

        if not nim or not password:
            return self._error('NIM dan password wajib diisi.')

        mahasiswa = request.env['mahasiswa.mahasiswa'].sudo().authenticate_nim(
            nim, password
        )
        if not mahasiswa:
            return self._error('NIM atau password salah.', 401)

        # Simpan NIM di session agar endpoint lain bisa kenal siapa yang login
        request.session['mahasiswa_nim'] = mahasiswa.nim

        return self._success({
            'nama': mahasiswa.name,
            'nim': mahasiswa.nim,
            'total_xp': mahasiswa.total_xp,
            'koin': mahasiswa.koin,
        })

    # ================================================
    # ENDPOINT LOGOUT: POST /api/auth/logout
    # ================================================
    @http.route('/api/auth/logout', type='http',
                auth='public', methods=['POST'], cors='*', csrf=False)
    def logout(self, **kw):
        request.session.pop('mahasiswa_nim', None)
        return self._success({'message': 'Logout berhasil.'})

    # ================================================
    # ENDPOINT 1: GET /api/mahasiswa/status
    # ================================================
    @http.route('/api/mahasiswa/status', type='http',
                auth='public', methods=['GET'], cors='*')
    def get_status(self, **kw):
        mhs = self._get_mahasiswa_from_session()
        if not mhs:
            return self._error('Belum login atau sesi habis.', 401)

        return self._success({
            'xp_rank': mhs.total_xp,   # field asli: total_xp
            'koin': mhs.koin,          # field asli: koin
        })

    # ================================================
    # ENDPOINT 2: POST /api/mahasiswa/action
    # ================================================
    @http.route('/api/mahasiswa/action', type='http',
                auth='public', methods=['POST'], cors='*', csrf=False)
    def post_action(self, **kw):
        mhs = self._get_mahasiswa_from_session()
        if not mhs:
            return self._error('Belum login atau sesi habis.', 401)

        try:
            body = json.loads(request.httprequest.data)
        except Exception:
            return self._error('Format request tidak valid, harus JSON.')

        action = body.get('action')
        jumlah = body.get('jumlah', 0)

        if not action:
            return self._error('Parameter "action" wajib diisi.')
        if not isinstance(jumlah, (int, float)) or jumlah <= 0:
            return self._error('Parameter "jumlah" harus angka lebih dari 0.')

        try:
            if action == 'add_xp':
                mhs.add_xp(jumlah)
            elif action == 'add_koin':
                mhs.add_koin(jumlah)
            elif action == 'spend_koin':
                mhs.spend_koin(jumlah)
            else:
                return self._error(f'Action "{action}" tidak dikenali.')
        except UserError as e:
            return self._error(str(e), 400)

        return self._success({
            'message': f'Action "{action}" berhasil.',
            'xp_rank': mhs.total_xp,
            'koin': mhs.koin,
        })

    # ================================================
    # ENDPOINT 3: GET /api/leaderboard
    # Menarik data top 10 mahasiswa berdasarkan total_xp
    # ================================================
    @http.route('/api/leaderboard', type='http',
                auth='public', methods=['GET'], cors='*')
    def get_leaderboard(self, **kw):
        # 1. Cek Autentikasi
        mhs = self._get_mahasiswa_from_session()
        if not mhs:
            return self._error('Belum login atau sesi habis.', 401)

        try:
            # 2. Tarik Data dari Database Odoo
            top_students = request.env['mahasiswa.mahasiswa'].sudo().search(
                [('active', '=', True)], 
                order='total_xp desc', 
                limit=10
            )

            # 3. Format Data untuk Frontend
            data_leaderboard = []
            for rank, student in enumerate(top_students, start=1):
                data_leaderboard.append({
                    'rank': rank,
                    'nama': student.name, 
                    'total_xp': student.total_xp,
                    'koin': student.koin
                })

            return self._success(data_leaderboard)
            
        except Exception as e:
            return self._error(f'Terjadi kesalahan internal: {str(e)}', 500)

    # ================================================
    # ENDPOINT: Mahasiswa Kumpul Tugas
    # POST /api/tugas/kumpul
    # Karena menggunakan input file, endpoint menerima FormData
    # ================================================
    @http.route('/api/tugas/kumpul', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def kumpul_tugas(self, **kw):
        mhs = self._get_mahasiswa_from_session()
        if not mhs:
            return self._error('Belum login atau sesi habis.', 401)
        
        tugas_id = kw.get('tugas_id')
        tipe_file = kw.get('tipe_file')
        catatan = kw.get('catatan', '')
        
        if not tugas_id or not tipe_file:
            return self._error('ID Tugas dan Tipe Pengumpulan wajib diisi.')
            
        tugas = request.env['tugas.tugas'].sudo().browse(int(tugas_id))
        if not tugas.exists():
            return self._error('Tugas tidak ditemukan.', 404)
            
        submission_vals = {
            'tugas_id': tugas.id,
            'mahasiswa_id': mhs.id,
            'tipe_file': tipe_file,
            'catatan': catatan,
            'waktu_kumpul': fields.Datetime.now()
        }
        
        if tipe_file == 'link':
            link_jawaban = kw.get('link_jawaban')
            if not link_jawaban:
                return self._error('Tautan/Link tugas wajib diisi.')
            submission_vals['link_jawaban'] = link_jawaban
            submission_vals['file_jawaban'] = False
        elif tipe_file == 'zip':
            file_upload = request.httprequest.files.get('file_jawaban')
            if not file_upload:
                return self._error('File tugas wajib diunggah.')
            # Baca file dan konversi ke Base64 agar dapat disimpan di field Binary Odoo
            submission_vals['file_jawaban'] = base64.b64encode(file_upload.read())
            submission_vals['link_jawaban'] = False
            
        # Cek apakah sebelumnya mahasiswa sudah pernah mengumpulkan tugas ini
        existing_sub = request.env['tugas.pengumpulan'].sudo().search([
            ('tugas_id', '=', tugas.id),
            ('mahasiswa_id', '=', mhs.id)
        ], limit=1)
        
        if existing_sub:
            # Jika sudah, timpa (update) pengumpulan sebelumnya
            existing_sub.write(submission_vals)
        else:
            # Jika belum, buat record baru
            request.env['tugas.pengumpulan'].sudo().create(submission_vals)
            
        return self._success({'message': 'Tugas berhasil dikumpulkan!'})