from odoo import models, fields, api
from odoo.exceptions import UserError


class PresensiSesi(models.Model):
    _name = 'presensi.sesi'
    _description = 'Sesi Presensi'

    name = fields.Char(string='Nama Sesi', required=True)
    dosen_id = fields.Many2one('res.users', string='Dosen',
                                default=lambda self: self.env.user)
    mata_kuliah_id = fields.Many2one(
    comodel_name='mata.kuliah',
    string='Mata Kuliah',
    required=True,
    ondelete='restrict',  # cegah matkul dihapus kalau masih ada sesi
)

    # Koordinat lokasi kelas
    latitude = fields.Float(string='Latitude', digits=(10, 7))
    longitude = fields.Float(string='Longitude', digits=(10, 7))
    radius_meter = fields.Integer(string='Radius (meter)', default=100)

    # Tipe kelas
    tipe_kelas = fields.Selection([
        ('online', 'Online'),
        ('offline', 'Offline'),
    ], default='offline', string='Tipe Kelas')

    # Waktu sesi
    waktu_buka = fields.Datetime(string='Waktu Buka')
    waktu_tutup = fields.Datetime(string='Waktu Tutup')
    batas_waktu_telat = fields.Datetime(string='Batas Waktu Tepat Waktu')

    # Status sesi
    status = fields.Selection([
        ('draft', 'Belum Dibuka'),
        ('open', 'Dibuka'),
        ('closed', 'Ditutup'),
    ], default='draft', string='Status')

    record_ids = fields.One2many(
        'presensi.record', 'sesi_id', string='Daftar Hadir'
    )
    total_hadir = fields.Integer(
        compute='_compute_total_hadir', string='Total Hadir'
    )

    @api.depends('record_ids')
    def _compute_total_hadir(self):
        for sesi in self:
            sesi.total_hadir = len(sesi.record_ids)

    def buka_sesi(self):
        if self.status != 'draft':
            raise UserError('Sesi sudah pernah dibuka.')
        self.write({
            'status': 'open',
            'waktu_buka': fields.Datetime.now(),
        })

    def tutup_sesi(self):
        if self.status != 'open':
            raise UserError('Sesi tidak sedang dibuka.')
        self.write({
            'status': 'closed',
            'waktu_tutup': fields.Datetime.now(),
        })