from odoo import http
from odoo.http import request
from odoo.exceptions import UserError
import json
import base64
from odoo import fields
import os
import sys

# Dapatkan path root proyek (2 tingkat di atas controllers)
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.append(project_root)

import jwt
import datetime

JWT_SECRET = 'GlassSuperSecretKey2024'  # Ganti dengan secret key yang aman di production

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

    def _get_mahasiswa_from_token(self):
        """Ambil mahasiswa berdasarkan JWT token dari header Authorization."""
        auth_header = request.httprequest.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            nim = payload.get('nim')
            return request.env['mahasiswa.mahasiswa'].sudo().search(
                [('nim', '=', nim), ('active', '=', True)], limit=1
            )
        except Exception:
            return None

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

        # Generate JWT Token
        payload = {
            'nim': mahasiswa.nim,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')

        return self._success({
            'nama': mahasiswa.name,
            'nim': mahasiswa.nim,
            'total_xp': mahasiswa.total_xp,
            'koin': mahasiswa.koin,
            'token': token
        })

    # ================================================
    # ENDPOINT LOGOUT: POST /api/auth/logout
    # ================================================
    @http.route('/api/auth/logout', type='http',
                auth='public', methods=['POST'], cors='*', csrf=False)
    def logout(self, **kw):
        # Klien bertanggung jawab menghapus token di sisi mereka
        return self._success({'message': 'Logout berhasil.'})

    # ================================================
    # ENDPOINT 1: GET /api/mahasiswa/status
    # ================================================
    @http.route('/api/mahasiswa/status', type='http',
                auth='public', methods=['GET'], cors='*')
    def get_status(self, **kw):
        mhs = self._get_mahasiswa_from_token()
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
        mhs = self._get_mahasiswa_from_token()
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
    # ENDPOINT 3A: GET /api/mahasiswa/leaderboard
    # Top XP mahasiswa untuk scope angkatan (nim[:2])
    # ================================================
    @http.route('/api/mahasiswa/leaderboard', type='http',
                auth='public', methods=['GET'], cors='*')
    def get_mahasiswa_leaderboard(self, **kw):
        mhs = self._get_mahasiswa_from_token()
        if not mhs:
            return self._error('Belum login atau sesi habis.', 401)

        angkatan = (mhs.nim or '')[:2]
        try:
            top_students = request.env['mahasiswa.mahasiswa'].sudo().search(
                [('active', '=', True), ('nim', 'like', angkatan + '%')],
                order='total_xp desc',
                limit=10,
            )

            data_leaderboard = []
            for rank, student in enumerate(top_students, start=1):
                data_leaderboard.append({
                    'rank': rank,
                    'nama': student.name,
                    'nim': student.nim,
                    'total_xp': student.total_xp,
                    'koin': student.koin,
                })

            return self._success(data_leaderboard)
        except Exception as e:
            return self._error(f'Terjadi kesalahan internal: {str(e)}', 500)

    # ================================================
    # ENDPOINT 3B: GET /api/dosen/leaderboard
    # Dosen melihat leaderboard mahasiswa berdasarkan prodi + filter angkatan (nim[:2])
    # ================================================
    @http.route('/api/dosen/leaderboard', type='http',
                auth='public', methods=['GET'], cors='*')
    def get_dosen_leaderboard(self, **kw):
        dosen = request.session.get('dosen_id')
        if not dosen:
            return self._error('Unauthorized', 401)

        dosen_rec = request.env['feature.dosen'].sudo().browse(int(dosen))
        if not dosen_rec.exists():
            return self._error('Unauthorized', 401)

        angkatan = kw.get('angkatan') or ''

        # Filter berdasarkan prodi dosen jika ada
        domain = [('active', '=', True)]
        if dosen_rec.prodi:
            domain.append(('prodi', '=', dosen_rec.prodi))
        if angkatan:
            domain.append(('nim', 'like', angkatan + '%'))

        try:
            top_students = request.env['mahasiswa.mahasiswa'].sudo().search(
                domain,
                order='total_xp desc',
                limit=10,
            )

            data_leaderboard = []
            for rank, student in enumerate(top_students, start=1):
                data_leaderboard.append({
                    'rank': rank,
                    'nama': student.name,
                    'nim': student.nim,
                    'prodi': student.prodi or '',
                    'total_xp': student.total_xp,
                    'koin': student.koin,
                })

            return self._success(data_leaderboard)
        except Exception as e:
            return self._error(f'Terjadi kesalahan internal: {str(e)}', 500)

    # NOTE: endpoint /api/leaderboard mock/tabrakan sudah dihapus.


    # ================================================
    # ENDPOINT: Mahasiswa Kumpul Tugas
    # POST /api/tugas/kumpul
    # Karena menggunakan input file, endpoint menerima FormData
    # ================================================
    @http.route('/api/tugas/kumpul', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def kumpul_tugas(self, **kw):
        mhs = self._get_mahasiswa_from_token()
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
            
        vals = {
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
            vals['link_jawaban'] = link_jawaban
            vals['file_jawaban'] = False
            vals['file_jawaban_name'] = False
        elif tipe_file == 'zip':
            file_upload = request.httprequest.files.get('file_jawaban')
            if not file_upload:
                return self._error('File tugas wajib diunggah.')
            # Baca file dan konversi ke Base64 agar dapat disimpan di field Binary Odoo
            vals['file_jawaban'] = base64.b64encode(file_upload.read())
            vals['file_jawaban_name'] = file_upload.filename
            vals['link_jawaban'] = False

        # Cek apakah sebelumnya mahasiswa sudah pernah mengumpulkan tugas ini
        existing_sub = request.env['tugas.pengumpulan'].sudo().search([
            ('tugas_id', '=', tugas.id),
            ('mahasiswa_id', '=', mhs.id)
        ], limit=1)
        
        if existing_sub:
            existing_sub.write(vals)
        else:
            request.env['tugas.pengumpulan'].sudo().create(vals)
            
        return self._success({'message': 'Tugas berhasil dikumpulkan!'})