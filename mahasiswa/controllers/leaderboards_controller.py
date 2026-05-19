from odoo import http
from odoo.http import request
from odoo.exceptions import AccessError
import json

class LeaderboardController(http.Controller):

    def _json_error(self, message, status=400):
        """Helper: kembalikan response error dalam format JSON."""
        payload = {'status': 'error', 'message': message}
        return request.make_response(
            json.dumps(payload),
            headers=[('Content-Type', 'application/json')],
            status=status
        )

    def _get_current_mahasiswa(self):
        uid = request.env.user.id
        mahasiswa = request.env['mahasiswa.mahasiswa'].sudo().search(
            [('user_id', '=', uid)], limit=1
        )
        return mahasiswa or None

    @http.route('/api/leaderboard', type='http',
                auth='user', methods=['GET'], cors='*')
    def get_leaderboard(self, **kw):
        mock_data = [
            {"rank": 1, "nama": "Andi",  "xp_total": 5000},
            {"rank": 2, "nama": "Budi",  "xp_total": 4500},
            {"rank": 3, "nama": "Citra", "xp_total": 3000},
        ]
        payload = {'status': 'success', 'data': mock_data}
        return request.make_response(
            json.dumps(payload),
            headers=[('Content-Type', 'application/json')]
        )

    @http.route('/api/mahasiswa/<int:target_id>/data', type='http',
                auth='user', methods=['GET'], cors='*')
    def get_mahasiswa_data(self, target_id, **kw):
        current = self._get_current_mahasiswa()
        if not current:
            return self._json_error('Profil mahasiswa tidak ditemukan.', 404)

        if current.id != target_id:
            return self._json_error('Akses ditolak.', 403)

        payload = {'status': 'success', 'data': {
            'nama': current.nama,
        }}
        return request.make_response(
            json.dumps(payload),
            headers=[('Content-Type', 'application/json')]
        )