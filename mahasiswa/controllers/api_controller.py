from odoo import http
from odoo.http import request
from odoo.exceptions import UserError
import json

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

    # ================================================
    # ENDPOINT 1: GET /api/mahasiswa/status
    # DATA PALSU dulu — nunggu Backend 1 konfirmasi nama model & field
    # ================================================
    @http.route('/api/mahasiswa/status', type='http',
                auth='user', methods=['GET'], cors='*')
    def get_status(self, **kw):
        # TODO: ganti mock_data ini setelah Backend 1 selesai
        mock_data = {
            'xp_rank': 1500,
            'koin': 500,
        }
        return self._success(mock_data)

    # ================================================
    # ENDPOINT 2: POST /api/mahasiswa/action
    # SKELETON dulu — logic pemanggilan fungsi Backend 1 menyusul
    # ================================================
    @http.route('/api/mahasiswa/action', type='http',
                auth='user', methods=['POST'], cors='*', csrf=False)
    def post_action(self, **kw):
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

        # TODO: ganti bagian ini setelah Backend 1 selesai
        # Sekarang langsung return sukses palsu dulu
        return self._success({
            'message': f'[MOCK] Action "{action}" diterima, jumlah: {jumlah}',
            'xp_rank': 1500,
            'koin': 500,
        })