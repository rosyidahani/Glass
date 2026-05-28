from odoo import models, fields


class RecordPresensi(models.Model):
    _name = 'presensi.record'
    _description = 'Record Kehadiran Mahasiswa'

    sesi_id = fields.Many2one(
        'presensi.sesi', string='Sesi',
        required=True, ondelete='cascade'
    )
    mahasiswa_id = fields.Many2one(
        'mahasiswa.mahasiswa', string='Mahasiswa', required=True
    )
    waktu_presensi = fields.Datetime(
        string='Waktu Presensi', default=fields.Datetime.now
    )
    status_kehadiran = fields.Selection([
        ('tepat_waktu', 'Tepat Waktu'),
        ('terlambat', 'Terlambat'),
    ], string='Status', default='tepat_waktu')

    is_manual = fields.Boolean(string='Input Manual Dosen', default=False)
    is_pertama = fields.Boolean(string='Presensi Pertama', default=False)
    xp_didapat = fields.Integer(string='XP Didapat', default=0)
    koin_didapat = fields.Integer(string='Koin Didapat', default=0)

    _sql_constraints = [
        ('unique_mahasiswa_sesi', 'UNIQUE(sesi_id, mahasiswa_id)',
         'Mahasiswa sudah melakukan presensi di sesi ini.'),
    ]