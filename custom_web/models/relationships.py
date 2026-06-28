from odoo import models, fields


class PresensiSesi(models.Model):
    _inherit = 'presensi.sesi'

    feature_dosen_id = fields.Many2one('feature.dosen', string='Dosen Pengajar (Portal)')
