from odoo import http
from odoo.http import request
import json


class LeaderboardController(http.Controller):
    """Controller leaderboard versi lama (mock) sudah dihapus.

    File ini dibiarkan ada hanya untuk endpoint yang masih dipakai.
    """

    def _json_error(self, message, status=400):
        payload = {'status': 'error', 'message': message}
        return request.make_response(
            json.dumps(payload),
            headers=[('Content-Type', 'application/json')],
            status=status,
        )

    def _get_current_mahasiswa(self):
        # Catatan: endpoint ini mengasumsikan user_id Odoo terhubung ke mahasiswa.
        uid = request.env.user.id
        mahasiswa = request.env['mahasiswa.mahasiswa'].sudo().search(
            [('user_id', '=', uid)], limit=1
        )
        return mahasiswa or None

    @http.route('/api/mahasiswa/<int:target_id>/data', type='http', auth='user', methods=['GET'], cors='*')
    def get_mahasiswa_data(self, target_id, **kw):
        current = self._get_current_mahasiswa()
        if not current:
            return self._json_error('Profil mahasiswa tidak ditemukan.', 404)

        if current.id != target_id:
            return self._json_error('Akses ditolak.', 403)

        payload = {
            'status': 'success',
            'data': {
                'nama': current.name,
                'nim': current.nim,
                'total_xp': current.total_xp,
                'koin': current.koin,
            },
        }
        return request.make_response(
            json.dumps(payload),
            headers=[('Content-Type', 'application/json')],
        )

