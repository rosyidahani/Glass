from odoo import http
from odoo.http import request
from odoo.exceptions import UserError
import json
import math
import datetime
import os
import sys

# Dapatkan path root proyek (2 tingkat di atas controllers)
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.append(project_root)

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
            # Fallback to session for Web Portal
            mahasiswa_id = request.session.get('mahasiswa_id')
            if mahasiswa_id:
                return request.env['mahasiswa.mahasiswa'].sudo().browse(mahasiswa_id)
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
    @http.route('/api/presensi/buka-sesi', type='json',
                auth='public', methods=['POST'], cors='*', csrf=False)
    def buka_sesi(self, **kw):
        dosen_id = request.session.get('dosen_id')
        if not dosen_id:
            return {'status': 'error', 'message': 'Unauthorized: Sesi Anda habis atau belum login.'}

        required = ['nama_sesi', 'mata_kuliah_id', 'tipe_kelas', 'batas_waktu_telat']
        for field in required:
            if field not in kw:
                return {'status': 'error', 'message': f'Field "{field}" wajib diisi.'}

        tipe_kelas = kw.get('tipe_kelas', 'offline')
        if tipe_kelas == 'offline':
            if 'latitude' not in kw or 'longitude' not in kw or 'radius_meter' not in kw:
                return {'status': 'error', 'message': 'Untuk kelas offline, latitude, longitude, dan radius wajib diisi.'}

        # Convert local time (Asia/Jakarta) input to UTC
        import pytz
        from datetime import datetime
        try:
            dt_str = kw['batas_waktu_telat'].replace('T', ' ')
            if len(dt_str) == 16:
                dt_str += ':00'
            local_dt = datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S')
            local_tz = pytz.timezone('Asia/Jakarta')
            localized_dt = local_tz.localize(local_dt)
            utc_dt = localized_dt.astimezone(pytz.utc)
            batas_waktu_utc = utc_dt.strftime('%Y-%m-%d %H:%M:%S')
        except Exception:
            batas_waktu_utc = kw['batas_waktu_telat']

        sesi_vals = {
            'name': kw['nama_sesi'],
            'mata_kuliah_id': int(kw['mata_kuliah_id']),
            'tipe_kelas': tipe_kelas,
            'batas_waktu_telat': batas_waktu_utc,
        }
        if tipe_kelas == 'offline':
            sesi_vals.update({
                'latitude': float(kw['latitude']),
                'longitude': float(kw['longitude']),
                'radius_meter': int(kw['radius_meter']),
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

        return {
            'status': 'success',
            'data': {
                'sesi_id': sesi.id,
                'status': sesi.status,
                'waktu_buka': str(sesi.waktu_buka),
            }
        }

    # ================================================
    # ENDPOINT: Dosen tutup sesi
    # POST /api/presensi/tutup-sesi
    # ================================================
    @http.route('/api/presensi/tutup-sesi', type='json',
                auth='public', methods=['POST'], cors='*', csrf=False)
    def tutup_sesi(self, **kw):
        dosen_id = request.session.get('dosen_id')
        if not dosen_id:
            return {'status': 'error', 'message': 'Unauthorized: Sesi Anda habis atau belum login.'}

        sesi_id = kw.get('sesi_id')
        if not sesi_id:
            return {'status': 'error', 'message': 'sesi_id wajib diisi.'}

        sesi = request.env['presensi.sesi'].sudo().browse(int(sesi_id))
        if not sesi.exists():
            return {'status': 'error', 'message': 'Sesi tidak ditemukan.'}

        try:
            sesi.tutup_sesi()
        except UserError as e:
            return {'status': 'error', 'message': str(e)}

        return {
            'status': 'success',
            'data': {'sesi_id': sesi.id, 'status': sesi.status}
        }

    # ================================================
    # ENDPOINT: Mahasiswa check-in
    # POST /api/presensi/check-in
    # ================================================
    @http.route('/api/presensi/check-in', type='json',
                auth='public', methods=['POST'], cors='*', csrf=False)
    def check_in(self, **kw):
        mhs = self._get_mahasiswa()
        if not mhs:
            return {'status': 'error', 'message': 'Belum login atau sesi habis.'}

        sesi_id = kw.get('sesi_id')
        is_mock = kw.get('is_mock_location', False)
        accuracy = kw.get('accuracy', 0)
        face_verified = kw.get('face_verified', False)
        # FaceID server-side verification (Backend 1)
        # Ambil descriptor dari client untuk dihitung kesamaannya di server.
        client_face_descriptor = kw.get('face_descriptor')
        face_method = kw.get('face_method', 'cosine')
        face_threshold = kw.get('face_threshold', 0.80)
    
        # Backend 1 - FaceID server-side only (device binding ditiadakan)
        device_id = kw.get('device_id')

        if not sesi_id:
            return {'status': 'error', 'message': 'sesi_id wajib diisi.'}

        # Backend 1 - verifikasi FaceID server-side
        # - Kompatibilitas: face_verified tetap dicek sebagai gate awal.
        # - Jika face_verified False => tetap ditolak.
        if not face_verified:
            return {'status': 'error', 'message': 'Verifikasi wajah gagal. Presensi ditolak.'}

        # Pastikan client kirim descriptor face vektor untuk dibandingkan di server
        if not client_face_descriptor:
            return {'status': 'error', 'message': 'face_descriptor wajib dikirim untuk verifikasi server-side.'}

        # FaceID similarity check
        from odoo.addons.presensi.models.faceid_service import verify_face_server_side
        res = verify_face_server_side(
            request.env,
            stored_encrypted_descriptor_b64=mhs.face_descriptor,
            client_descriptor=client_face_descriptor,
            method=face_method,
            threshold=face_threshold,
        )
        
        import logging
        _logger = logging.getLogger(__name__)
        _logger.info("=== FACE VERIFICATION ===")
        _logger.info("Mahasiswa: %s (NIM: %s)", mhs.name, mhs.nim)
        _logger.info("Method: %s, Threshold: %s", face_method, face_threshold)
        _logger.info("Result Score: %s, Passed: %s", res.get('score'), res.get('ok'))
        _logger.info("=========================")

        if not res.get('ok'):
            return {'status': 'error', 'message': 'Verifikasi wajah gagal. Wajah Anda tidak cocok dengan data yang terdaftar.'}

        # Ambil sesi
        sesi = request.env['presensi.sesi'].sudo().browse(int(sesi_id))
        if not sesi.exists():
            return {'status': 'error', 'message': 'Sesi tidak ditemukan.'}
        if sesi.status != 'open':
            return {'status': 'error', 'message': 'Sesi presensi sudah ditutup.'}

        # Cek sudah presensi belum
        sudah = request.env['presensi.record'].sudo().search([
            ('sesi_id', '=', sesi.id),
            ('mahasiswa_id', '=', mhs.id),
        ], limit=1)
        if sudah:
            return {'status': 'error', 'message': 'Kamu sudah melakukan presensi di sesi ini.'}

        # Validasi jarak GPS hanya jika kelas offline
        jarak = 0
        if sesi.tipe_kelas == 'offline':
            latitude = kw.get('latitude')
            longitude = kw.get('longitude')
            if not latitude or not longitude:
                return {'status': 'error', 'message': 'Untuk kelas luring (offline), koordinat lokasi Anda wajib dikirim.'}

            # Cek fake GPS
            if self._deteksi_fake_gps(is_mock, accuracy):
                return {'status': 'error', 'message': 'Terdeteksi lokasi palsu (Fake GPS). Presensi ditolak.'}

            jarak = self._hitung_jarak_meter(
                float(latitude), float(longitude),
                sesi.latitude, sesi.longitude
            )
            if jarak > sesi.radius_meter:
                return {'status': 'error', 'message': f'Lokasi kamu terlalu jauh dari kelas ({round(jarak)} meter, batas {sesi.radius_meter} meter).'}

        # Tentukan tepat waktu / terlambat
        from odoo.fields import Datetime
        now = Datetime.now()
        is_telat = (sesi.batas_waktu_telat and now > sesi.batas_waktu_telat)

        # Cek urutan kehadiran
        jumlah_hadir = request.env['presensi.record'].sudo().search_count([('sesi_id', '=', sesi.id)])
        urutan_hadir = jumlah_hadir + 1

        # Hitung reward
        if is_telat:
            xp, koin = 0, 0
        elif urutan_hadir == 1:
            xp, koin = 5, 25
        else:
            xp, koin = 3, 15

        # Simpan record
        record = request.env['presensi.record'].sudo().create({
            'sesi_id': sesi.id,
            'mahasiswa_id': mhs.id,
            'status_kehadiran': 'terlambat' if is_telat else 'tepat_waktu',
            'is_pertama': (urutan_hadir == 1),
            'xp_didapat': xp,
            'koin_didapat': koin,
        })

        # Beri reward
        if xp > 0:
            mhs.add_xp(xp)
        if koin > 0:
            mhs.add_koin(koin)

        return {
            'status': 'success',
            'data': {
                'status_kehadiran': record.status_kehadiran,
                'is_pertama': (urutan_hadir == 1),
                'urutan_hadir': urutan_hadir,
                'xp_didapat': xp,
                'koin_didapat': koin,
                'jarak_meter': round(jarak),
                'mata_kuliah': sesi.mata_kuliah_id.nama,  
            }
        }

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

        # Tentukan apakah terlambat/dalam waktu presensi
        from odoo.fields import Datetime
        now = Datetime.now()
        is_telat = (sesi.status != 'open') or (sesi.batas_waktu_telat and now > sesi.batas_waktu_telat)

        xp = 0 if is_telat else 3
        koin = 0 if is_telat else 15
        status_kehadiran = 'terlambat' if is_telat else 'tepat_waktu'

        request.env['presensi.record'].sudo().create({
            'sesi_id': sesi.id,
            'mahasiswa_id': int(mahasiswa_id),
            'status_kehadiran': status_kehadiran,
            'is_manual': True,
            'xp_didapat': xp,
            'koin_didapat': koin,
        })

        mhs = request.env['mahasiswa.mahasiswa'].sudo().browse(int(mahasiswa_id))
        if mhs.exists():
            if xp > 0:
                mhs.add_xp(xp)
            if koin > 0:
                mhs.add_koin(koin)

        return self._success({'message': 'Presensi manual berhasil dicatat.'})