import json
import pytz
from datetime import datetime

from odoo import http
from odoo.http import request

JWT_SECRET = 'GlassSuperSecretKey2024'


class DosenSettingsAPI(http.Controller):

    def _json_error(self, message, status=400):
        return request.make_response(
            json.dumps({'status': 'error', 'message': message}),
            headers=[('Content-Type', 'application/json')],
            status=status,
        )

    def _json_success(self, data=None):
        if data is None:
            data = {}
        return request.make_response(
            json.dumps({'status': 'success', 'data': data}),
            headers=[('Content-Type', 'application/json')],
        )

    def _get_logged_dosen(self):
        dosen_id = request.session.get('dosen_id')
        if not dosen_id:
            return None
        dosen = request.env['feature.dosen'].sudo().browse(int(dosen_id))
        return dosen if dosen.exists() else None

    @http.route('/api/dosen/settings/upload-foto', type='http', auth='public', methods=['POST'], csrf=False, cors='*')
    def upload_foto(self, **kw):
        dosen = self._get_logged_dosen()
        if not dosen:
            return self._json_error('Unauthorized', 401)

        try:
            body = json.loads(request.httprequest.data or '{}')
        except Exception:
            return self._json_error('Format JSON tidak valid.')

        foto_base64 = body.get('foto_base64')
        if not foto_base64:
            return self._json_error('foto_base64 wajib diisi.')

        # Odoo image fields expects base64 string; client sends base64 without data url prefix.
        dosen.sudo().write({'foto_profil': foto_base64})
        return self._json_success({'foto_profil': True})

    @http.route('/api/dosen/settings/ganti-sandi', type='http', auth='public', methods=['POST'], csrf=False, cors='*')
    def ganti_sandi(self, **kw):
        dosen = self._get_logged_dosen()
        if not dosen:
            return self._json_error('Unauthorized', 401)

        try:
            body = json.loads(request.httprequest.data or '{}')
        except Exception:
            return self._json_error('Format JSON tidak valid.')

        old_password = body.get('old_password')
        new_password = body.get('new_password')

        if not old_password or not new_password:
            return self._json_error('old_password dan new_password wajib diisi.')

        # Perbaikan Keamanan: Jangan bandingkan plain text. Gunakan metode otentikasi.
        # Asumsi model 'feature.dosen' memiliki metode 'authenticate_nip'
        if not request.env['feature.dosen'].sudo().authenticate_nip(dosen.nip, old_password):
            return self._json_error('Password lama tidak sesuai.', 400)

        dosen.sudo().write({'password': new_password})
        return self._json_success({'password': True})

    @http.route('/api/dosen/settings/set-tema', type='http', auth='public', methods=['POST'], csrf=False, cors='*')
    def set_tema(self, **kw):
        dosen = self._get_logged_dosen()
        if not dosen:
            return self._json_error('Unauthorized', 401)

        try:
            body = json.loads(request.httprequest.data or '{}')
        except Exception:
            return self._json_error('Format JSON tidak valid.')

        tema = body.get('tema_preference')
        if tema not in ['oceanbreeze', 'midnight_slate', 'amethyst_dream']:
            return self._json_error('Tema tidak valid.')

        dosen.sudo().write({'tema_preference': tema})
        return self._json_success({'tema_preference': tema})

    @http.route('/api/dosen/settings/set-bahasa', type='http', auth='public', methods=['POST'], csrf=False, cors='*')
    def set_bahasa(self, **kw):

        dosen = self._get_logged_dosen()

        if not dosen:
            return self._json_error('Unauthorized', 401)

        try:
            body = json.loads(request.httprequest.data or '{}')
        except Exception:
            return self._json_error('Format JSON tidak valid.')

        bahasa = body.get('bahasa_preference')
        if bahasa not in ['id', 'en']:
            return self._json_error('Bahasa tidak valid.')

        dosen.sudo().write({'bahasa_preference': bahasa})
        return self._json_success({'bahasa_preference': bahasa})

    @http.route('/api/dosen/settings/set-faq', type='http', auth='public', methods=['POST'], csrf=False, cors='*')
    def set_faq(self, **kw):
        dosen = self._get_logged_dosen()
        if not dosen:
            return self._json_error('Unauthorized', 401)

        try:
            body = json.loads(request.httprequest.data or '{}')
        except Exception:
            return self._json_error('Format JSON tidak valid.')

        faq_tentang = body.get('faq_tentang') or ''
        faq_penggunaan = body.get('faq_penggunaan') or ''

        dosen.sudo().write({
            'faq_tentang': faq_tentang,
            'faq_penggunaan': faq_penggunaan,
        })
        return self._json_success({'faq_tentang': True, 'faq_penggunaan': True})
