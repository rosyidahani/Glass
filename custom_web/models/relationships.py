from odoo import models, fields


class MataKuliah(models.Model):
    _inherit = 'mata.kuliah'

    dosen_id = fields.Many2one('feature.dosen', string='Dosen Pengampu (Portal)')


class PresensiSesi(models.Model):
    _inherit = 'presensi.sesi'

    feature_dosen_id = fields.Many2one('feature.dosen', string='Dosen Pengajar (Portal)')
