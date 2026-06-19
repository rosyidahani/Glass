from odoo import http
from odoo.http import request
from odoo.exceptions import UserError
import json
import math
import datetime
import jwt

JWT_SECRET = 'GlassSuperSecretKey2024'


class PresensiController(http.Controller):

    # ================================================
    # HELPER
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

    def _hitung_jarak_meter(self, lat1, lon1, lat2, lon2):
        """Rumus Haversine — hitung jarak dua koordinat dalam meter."""
        R = 6371000
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = (math.sin(dphi / 2) ** 2 +
             math.cos(phi1) * math.cos(phi2) *
             math.sin(dlambda / 2) ** 2)
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def _deteksi_fake_gps(self, is_mock, accuracy):
        if is_mock:
            return True
        if accuracy and float(accuracy) > 500:
            return True
        return False

    # ================================================
    # ENDPOINT: Dosen buka sesi
    # POST /api/presensi/buka-sesi
    # ================================================
    @http.route('/api/presensi/buka-sesi', type='http',
                auth='user', methods=['POST'], cors='*', csrf=False)
    def buka_sesi(self, **kw):
        try:
            body = json.loads(request.httprequest.data)
        except Exception:
            return self._error('Format JSON tidak valid.')

        required = ['nama_sesi', 'mata_kuliah_id', 'tipe_kelas', 'batas_waktu_telat']
        for field in required:
            if field not in body:
                return self._error(f'Field "{field}" wajib diisi.')

        tipe_kelas = body.get('tipe_kelas', 'offline')
        if tipe_kelas == 'offline':
            if 'latitude' not in body or 'longitude' not in body or 'radius_meter' not in body:
                return self._error('Untuk kelas offline, latitude, longitude, dan radius wajib diisi.')

        # Convert local time (Asia/Jakarta) input to UTC
        import pytz
        from datetime import datetime
        try:
            dt_str = body['batas_waktu_telat'].replace('T', ' ')
            if len(dt_str) == 16:
                dt_str += ':00'
            local_dt = datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S')
            local_tz = pytz.timezone('Asia/Jakarta')
            localized_dt = local_tz.localize(local_dt)
            utc_dt = localized_dt.astimezone(pytz.utc)
            batas_waktu_utc = utc_dt.strftime('%Y-%m-%d %H:%M:%S')
        except Exception:
            batas_waktu_utc = body['batas_waktu_telat']

        sesi_vals = {
            'name': body['nama_sesi'],
            'mata_kuliah_id': int(body['mata_kuliah_id']),
            'tipe_kelas': tipe_kelas,
            'batas_waktu_telat': batas_waktu_utc,
        }
        if tipe_kelas == 'offline':
            sesi_vals.update({
                'latitude': float(body['latitude']),
                'longitude': float(body['longitude']),
                'radius_meter': int(body['radius_meter']),
            })
        else:
            sesi_vals.update({
                'latitude': 0.0,
                'longitude': 0.0,
                'radius_meter': 0,
            })

        dosen_id = request.session.get('dosen_id')
        if dosen_id:
            sesi_vals['feature_dosen_id'] = dosen_id

        sesi = request.env['presensi.sesi'].sudo().create(sesi_vals)
        sesi.buka_sesi()

        return self._success({
            'sesi_id': sesi.id,
            'status': sesi.status,
            'waktu_buka': str(sesi.waktu_buka),
        })

    # ================================================
    # ENDPOINT: Dosen tutup sesi
    # POST /api/presensi/tutup-sesi
    # ================================================
    @http.route('/api/presensi/tutup-sesi', type='http',
                auth='user', methods=['POST'], cors='*', csrf=False)
    def tutup_sesi(self, **kw):
        try:
            body = json.loads(request.httprequest.data)
        except Exception:
            return self._error('Format JSON tidak valid.')

        sesi_id = body.get('sesi_id')
        if not sesi_id:
            return self._error('sesi_id wajib diisi.')

        sesi = request.env['presensi.sesi'].sudo().browse(int(sesi_id))
        if not sesi.exists():
            return self._error('Sesi tidak ditemukan.', 404)

        try:
            sesi.tutup_sesi()
        except UserError as e:
            return self._error(str(e))

        return self._success({'sesi_id': sesi.id, 'status': sesi.status})

    # ================================================
    # ENDPOINT: Mahasiswa check-in
    # POST /api/presensi/check-in
    # ================================================
    @http.route('/api/presensi/check-in', type='http',
                auth='public', methods=['POST'], cors='*', csrf=False)
    def check_in(self, **kw):
        mhs = self._get_mahasiswa()
        if not mhs:
            return self._error('Belum login atau sesi habis.', 401)

        try:
            body = json.loads(request.httprequest.data)
        except Exception:
            return self._error('Format JSON tidak valid.')

        sesi_id = body.get('sesi_id')
        is_mock = body.get('is_mock_location', False)
        accuracy = body.get('accuracy', 0)
        face_verified = body.get('face_verified', False)
        # FaceID server-side verification (Backend 1)
        # Ambil descriptor dari client untuk dihitung kesamaannya di server.
        client_face_descriptor = body.get('face_descriptor')
        face_method = body.get('face_method', 'cosine')
        face_threshold = body.get('face_threshold', 0.82)

        # Backend 1 - FaceID server-side only (device binding ditiadakan)
        device_id = body.get('device_id')



        if not sesi_id:
            return self._error('sesi_id wajib diisi.')

        # Backend 1 - verifikasi FaceID server-side
        # - Kompatibilitas: face_verified tetap dicek sebagai gate awal.
        # - Jika face_verified False => tetap ditolak.
        if not face_verified:
            return self._error('Verifikasi wajah gagal. Presensi ditolak.', 403)

        # Pastikan client kirim descriptor face vektor untuk dibandingkan di server.
        if not client_face_descriptor:
            return self._error('face_descriptor wajib dikirim untuk verifikasi server-side.', 403)



        # FaceID similarity check
        from presensi.models.faceid_service import verify_face_server_side
        res = verify_face_server_side(
            request.env,
            stored_encrypted_descriptor_b64=mhs.face_descriptor,
            client_descriptor=client_face_descriptor,
            method=face_method,
            threshold=face_threshold,
        )
        if not res.get('ok'):
            return self._error('FaceID server-side verification gagal. Presensi ditolak.', 403)


        # Ambil sesi
        sesi = request.env['presensi.sesi'].sudo().browse(int(sesi_id))
        if not sesi.exists():
            return self._error('Sesi tidak ditemukan.', 404)
        if sesi.status != 'open':
            return self._error('Sesi presensi sudah ditutup.', 403)

        # Cek sudah presensi belum
        sudah = request.env['presensi.record'].sudo().search([
            ('sesi_id', '=', sesi.id),
            ('mahasiswa_id', '=', mhs.id),
        ], limit=1)
        if sudah:
            return self._error('Kamu sudah melakukan presensi di sesi ini.')

        # Validasi jarak GPS hanya jika kelas offline
        jarak = 0
        if sesi.tipe_kelas == 'offline':
            latitude = body.get('latitude')
            longitude = body.get('longitude')
            if not latitude or not longitude:
                return self._error('Untuk kelas luring (offline), koordinat lokasi Anda wajib dikirim.')

            # Cek fake GPS
            if self._deteksi_fake_gps(is_mock, accuracy):
                return self._error(
                    'Terdeteksi lokasi palsu (Fake GPS). Presensi ditolak.', 403
                )

            jarak = self._hitung_jarak_meter(
                float(latitude), float(longitude),
                sesi.latitude, sesi.longitude
            )
            if jarak > sesi.radius_meter:
                return self._error(
                    f'Lokasi kamu terlalu jauh dari kelas '
                    f'({round(jarak)} meter, batas {sesi.radius_meter} meter).',
                    403
                )

        # Tentukan tepat waktu / terlambat
        from odoo.fields import Datetime
        now = Datetime.now()
        is_telat = (sesi.batas_waktu_telat and now > sesi.batas_waktu_telat)

        # Cek apakah termasuk 3 mahasiswa pertama yang melakukan presensi
        jumlah_hadir = request.env['presensi.record'].sudo().search_count([('sesi_id', '=', sesi.id)])
        is_pertama = (jumlah_hadir < 3)

        # Hitung reward
        if is_telat:
            xp, koin = 0, 0
        elif is_pertama:
            xp, koin = 25, 5
        else:
            xp, koin = 15, 3

        # Simpan record
        record = request.env['presensi.record'].sudo().create({
            'sesi_id': sesi.id,
            'mahasiswa_id': mhs.id,
            'status_kehadiran': 'terlambat' if is_telat else 'tepat_waktu',
            'is_pertama': is_pertama,
            'xp_didapat': xp,
            'koin_didapat': koin,
        })

        # Beri reward
        if xp > 0:
            mhs.add_xp(xp)
        if koin > 0:
            mhs.add_koin(koin)

        return self._success({
            'status_kehadiran': record.status_kehadiran,
            'is_pertama': is_pertama,
            'xp_didapat': xp,
            'koin_didapat': koin,
            'jarak_meter': round(jarak),
            'mata_kuliah': sesi.mata_kuliah_id.nama,  
        })

    # ================================================
    # ENDPOINT: Presensi manual dosen
    # POST /api/presensi/manual
    # ================================================
    @http.route('/api/presensi/manual', type='http',
                auth='user', methods=['POST'], cors='*', csrf=False)
    def presensi_manual(self, **kw):
        try:
            body = json.loads(request.httprequest.data)
        except Exception:
            return self._error('Format JSON tidak valid.')

        sesi_id = body.get('sesi_id')
        mahasiswa_id = body.get('mahasiswa_id')

        if not all([sesi_id, mahasiswa_id]):
            return self._error('sesi_id dan mahasiswa_id wajib diisi.')

        sesi = request.env['presensi.sesi'].sudo().browse(int(sesi_id))
        if not sesi.exists():
            return self._error('Sesi tidak ditemukan.', 404)

        sudah = request.env['presensi.record'].sudo().search([
            ('sesi_id', '=', sesi.id),
            ('mahasiswa_id', '=', int(mahasiswa_id)),
        ], limit=1)
        if sudah:
            return self._error('Mahasiswa sudah tercatat hadir.')

        request.env['presensi.record'].sudo().create({
            'sesi_id': sesi.id,
            'mahasiswa_id': int(mahasiswa_id),
            'status_kehadiran': 'tepat_waktu',
            'is_manual': True,
            'xp_didapat': 0,
            'koin_didapat': 0,
        })

        return self._success({'message': 'Presensi manual berhasil dicatat.'})