from odoo import http
from odoo.http import request
import json
import jwt

JWT_SECRET = 'GlassSuperSecretKey2024'


class MataKuliahController(http.Controller):

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

    def _get_mahasiswa(self):
        auth_header = request.httprequest.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            return request.env['mahasiswa.mahasiswa'].sudo().search(
                [('nim', '=', payload.get('nim')), ('active', '=', True)], limit=1
            )
        except Exception:
            return None

    # ================================================
    # ENDPOINT: Ambil daftar matkul milik mahasiswa
    # Dipakai Frontend untuk tampilkan pilihan matkul sebelum absen
    # GET /api/mata-kuliah/saya
    # ================================================
    @http.route('/api/mata-kuliah/saya', type='http',
                auth='public', methods=['GET'], cors='*')
    def get_matkul_saya(self, **kw):
        mhs = self._get_mahasiswa()
        if not mhs:
            return self._error('Belum login atau sesi habis.', 401)

        hasil = []
        for mk in mhs.mata_kuliah_ids:
            hasil.append({
                'id'              : mk.id,
                'kode'            : mk.kode,
                'nama'            : mk.nama,
                'sks'             : mk.sks,
                'semester'        : mk.semester,
                'dosen_pengampu'  : mk.dosen_pengampu or '-',
            })

        return self._success(hasil)

    # ================================================
    # ENDPOINT: Ambil semua matkul (untuk admin/dosen)
    # GET /api/mata-kuliah/semua
    # ================================================
    @http.route('/api/mata-kuliah/semua', type='http',
                auth='user', methods=['GET'], cors='*')
    def get_semua_matkul(self, **kw):
        semua = request.env['mata.kuliah'].sudo().search([])

        hasil = []
        for mk in semua:
            hasil.append({
                'id'              : mk.id,
                'kode'            : mk.kode,
                'nama'            : mk.nama,
                'sks'             : mk.sks,
                'semester'        : mk.semester,
                'dosen_pengampu'  : mk.dosen_pengampu or '-',
                'total_mahasiswa' : len(mk.mahasiswa_ids),
            })

        return self._success(hasil)

    # ================================================
    # ENDPOINT: Daftarkan mahasiswa ke matkul
    # POST /api/mata-kuliah/daftar
    # ================================================
    @http.route('/api/mata-kuliah/daftar', type='http',
                auth='public', methods=['POST'], cors='*', csrf=False)
    def daftar_matkul(self, **kw):
        mhs = self._get_mahasiswa()
        if not mhs:
            return self._error('Belum login atau sesi habis.', 401)

        try:
            body = json.loads(request.httprequest.data)
        except Exception:
            return self._error('Format JSON tidak valid.')

        # Bisa daftar satu atau beberapa matkul sekaligus
        # Kirim list of id: { "mata_kuliah_ids": [1, 2, 3] }
        mk_ids = body.get('mata_kuliah_ids', [])
        if not mk_ids or not isinstance(mk_ids, list):
            return self._error('mata_kuliah_ids wajib diisi berupa list ID.')

        # Validasi semua ID valid
        matkul_records = request.env['mata.kuliah'].sudo().browse(mk_ids)
        if len(matkul_records) != len(mk_ids):
            return self._error('Beberapa mata kuliah tidak ditemukan.', 404)

        # Tambahkan ke relasi (tidak hapus yang lama)
        mhs.sudo().write({
            'mata_kuliah_ids': [(4, mk_id) for mk_id in mk_ids]
        })

        return self._success({
            'message'          : 'Berhasil mendaftar mata kuliah.',
            'total_matkul'     : len(mhs.mata_kuliah_ids),
        })

    # ================================================
    # ENDPOINT: Batalkan matkul mahasiswa
    # POST /api/mata-kuliah/batalkan
    # ================================================
    @http.route('/api/mata-kuliah/batalkan', type='http',
                auth='public', methods=['POST'], cors='*', csrf=False)
    def batalkan_matkul(self, **kw):
        mhs = self._get_mahasiswa()
        if not mhs:
            return self._error('Belum login atau sesi habis.', 401)

        try:
            body = json.loads(request.httprequest.data)
        except Exception:
            return self._error('Format JSON tidak valid.')

        mk_id = body.get('mata_kuliah_id')
        if not mk_id:
            return self._error('mata_kuliah_id wajib diisi.')

        # Hapus relasi saja, bukan hapus data matkul
        mhs.sudo().write({
            'mata_kuliah_ids': [(3, int(mk_id))]
        })

        return self._success({'message': 'Mata kuliah berhasil dibatalkan.'})