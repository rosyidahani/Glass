from odoo import models, fields


class MataKuliah(models.Model):
    _name = 'mata.kuliah'
    _description = 'Mata Kuliah'
    _rec_name = 'nama'

    kode = fields.Char(
        string='Kode Mata Kuliah',
        required=True,
        index=True,
        help='Contoh: MK001, IF301'
    )
    nama = fields.Char(
        string='Nama Mata Kuliah',
        required=True,
    )
    sks = fields.Integer(
        string='SKS',
        default=2,
    )
    semester = fields.Integer(
        string='Semester',
        default=1,
    )
    dosen_pengampu = fields.Char(
        string='Dosen Pengampu',
    )
    active = fields.Boolean(
        string='Active',
        default=True,
    )

    # Many2many ke mahasiswa
    # Satu matkul bisa diambil banyak mahasiswa
    # Satu mahasiswa bisa ambil banyak matkul
    mahasiswa_ids = fields.Many2many(
        comodel_name='mahasiswa.mahasiswa',
        relation='mahasiswa_mata_kuliah_rel',  # nama tabel relasi di database
        column1='mata_kuliah_id',
        column2='mahasiswa_id',
        string='Mahasiswa yang Mengambil',
    )

    _sql_constraints = [
        ('kode_unique', 'UNIQUE(kode)', 'Kode mata kuliah sudah terdaftar!'),
    ]


class MahasiswaMataKuliah(models.Model):
    """
    Extend model mahasiswa untuk tambah field Many2many dari sisi mahasiswa.
    Pakai _inherit agar tidak ubah file milik Backend 1.
    """
    _inherit = 'mahasiswa.mahasiswa'

    mata_kuliah_ids = fields.Many2many(
        comodel_name='mata.kuliah',
        relation='mahasiswa_mata_kuliah_rel',  # nama tabel relasi SAMA
        column1='mahasiswa_id',
        column2='mata_kuliah_id',
        string='Mata Kuliah yang Diambil',
    )