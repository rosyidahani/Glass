import json

from odoo import http
from odoo.http import request


class PrefsController(http.Controller):
    """API baca/tulis preferensi aplikasi mahasiswa.

    Endpoint:
      - GET  /api/mahasiswa/prefs
      - POST /api/mahasiswa/prefs

    Auth: JWT Bearer token (token berisi nim) memakai mekanisme di MahasiswaAPI.

    Catatan:
    - Untuk integrasi minimal, controller ini melakukan decode token
      dengan secret yang sama seperti `mahasiswa/controllers/api_controller.py`.
    """

    JWT_SECRET = 'GlassSuperSecretKey2024'

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
        import jwt

        auth_header = request.httprequest.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, self.JWT_SECRET, algorithms=['HS256'])
            nim = payload.get('nim')
            if not nim:
                return None
            return request.env['mahasiswa.mahasiswa'].sudo().search(
                [('nim', '=', nim), ('active', '=', True)], limit=1
            )
        except Exception:
            return None

    @http.route('/api/mahasiswa/prefs', type='http', auth='public', methods=['GET'], cors='*', csrf=False)
    def get_prefs(self, **kw):
        mhs = self._get_mahasiswa_from_token()
        if not mhs:
            return self._error('Belum login atau token tidak valid.', 401)

        return self._success({
            'tema_aplikasi': mhs.tema_aplikasi,
            'bahasa': mhs.bahasa,
        })

    @http.route('/api/mahasiswa/prefs', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def set_prefs(self, **kw):
        mhs = self._get_mahasiswa_from_token()
        if not mhs:
            return self._error('Belum login atau token tidak valid.', 401)

        try:
            body = json.loads(request.httprequest.data)
        except Exception:
            return self._error('Format request tidak valid, harus JSON.')

        tema = body.get('tema_aplikasi', mhs.tema_aplikasi)
        bahasa = body.get('bahasa', mhs.bahasa)

        # Validasi sederhana
        if tema not in ['light', 'dark']:
            return self._error('tema_aplikasi harus "light" atau "dark".')

        if not bahasa or not isinstance(bahasa, str) or len(bahasa) > 8:
            return self._error('bahasa tidak valid (maks 8 karakter).')

        mhs.sudo().write({
            'tema_aplikasi': tema,
            'bahasa': bahasa,
        })

        return self._success({
            'tema_aplikasi': tema,
            'bahasa': bahasa,
        })

