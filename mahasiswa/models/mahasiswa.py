import hashlib

from odoo import models, fields, api
from odoo.exceptions import UserError


class Mahasiswa(models.Model):
    _name = 'mahasiswa.mahasiswa'
    _description = 'Data Mahasiswa'
    _rec_name = 'name'

    nim = fields.Char(
        string='NIM',
        required=True,
        index=True,
        help='Nomor Induk Mahasiswa, digunakan untuk login.',
    )
    password = fields.Char(
        string='Password',
        required=True,
        help='Password untuk login (disimpan dalam bentuk hash SHA-256).',
    )
    name = fields.Char(
        string='Nama',
        required=True,
    )
    foto_profil = fields.Image(
        string='Foto Profil',
        max_width=354,
        max_height=472,
        help='Foto profil mahasiswa ukuran 3x4 cm (354x472 px).',
    )
    total_xp = fields.Integer(
        string='Total XP',
        default=0,
    )
    koin = fields.Integer(
        string='Koin',
        default=0,
    )
    semester = fields.Integer(
        string='Semester',
        default=1,
    )
    active = fields.Boolean(
        string='Active',
        default=True,
    )
    
    # Field Tambahan Sesuai Spesifikasi Baru
    device_id = fields.Char(
        string='Device ID',
        help='ID perangkat terdaftar untuk Device Binding (Anti-Kecurangan).'
    )
    face_descriptor = fields.Text(
        string='Face Descriptor',
        help='Data biometrik vektor wajah mahasiswa (Terenkripsi AES-256).'
    )
    tema_aplikasi = fields.Selection(
        [('light', 'Light'), ('dark', 'Dark')],
        string='Tema Aplikasi',
        default='light'
    )
    bahasa = fields.Char(
        string='Bahasa',
        default='id'
    )

    prodi = fields.Char(
        string='Program Studi',
        help='Program studi mahasiswa untuk kebutuhan leaderboard dosen dan filter angkatan.',
    )
    mata_kuliah_ids = fields.Many2many(
        'mata.kuliah',
        string='Mata Kuliah yang Diambil'
    )

    _sql_constraints = [


        ('nim_unique', 'UNIQUE(nim)', 'NIM sudah terdaftar!'),
    ]

    # ------------------------------------------------------------------
    # Helper: hashing
    # ------------------------------------------------------------------
    @staticmethod
    def _hash_password(raw_password):
        """Hash password menggunakan SHA-256.
        Bisa diganti dengan algoritma lain di kemudian hari."""
        return hashlib.sha256(raw_password.encode('utf-8')).hexdigest()

    # ------------------------------------------------------------------
    # ORM overrides
    # ------------------------------------------------------------------
    @api.model_create_multi
    def create(self, vals_list):
        """Hash password saat membuat record baru."""
        for vals in vals_list:
            if vals.get('password'):
                vals['password'] = self._hash_password(vals['password'])
        return super().create(vals_list)

    def write(self, vals):
        """Hash password saat mengupdate record jika password berubah."""
        if vals.get('password'):
            vals['password'] = self._hash_password(vals['password'])
        return super().write(vals)

    # ------------------------------------------------------------------
    # Authentication
    # ------------------------------------------------------------------

    @api.model
    def authenticate_nim(self, nim, password):
        """Autentikasi mahasiswa berdasarkan NIM dan password.
        Returns: recordset mahasiswa jika valid, False jika tidak."""
        mahasiswa = self.sudo().search(
            [('nim', '=', nim), ('active', '=', True)], limit=1
        )
        if mahasiswa and mahasiswa.password == self._hash_password(password):
            return mahasiswa
        return False

    # ------------------------------------------------------------------
    # Display name
    # ------------------------------------------------------------------
    def name_get(self):
        result = []
        for rec in self:
            parts = []
            if rec.nim:
                parts.append(f"[{rec.nim}]")
            
            parts.append(rec.name)
            
            meta_info = []
            if rec.prodi:
                meta_info.append(rec.prodi)
            if rec.semester:
                meta_info.append(f"Semester {rec.semester}")
            
            if meta_info:
                parts.append(f"({' - '.join(meta_info)})")
                
            display = " ".join(parts)
            result.append((rec.id, display))
        return result

    # ------------------------------------------------------------------
    # XP & Koin Management
    # ------------------------------------------------------------------
    def add_xp(self, jumlah):
        """Menambah angka XP."""
        self.total_xp += jumlah

    def add_koin(self, jumlah):
        """Menambah angka koin."""
        self.koin += jumlah

    def spend_koin(self, jumlah):
        """Fungsi untuk belajar/mengurangi koin lengkap dengan validasi.
        Jika koin kurang, sistem akan melempar UserError agar transaksi gagal."""
        if self.koin < jumlah:
            raise UserError('Koin tidak cukup untuk melakukan transaksi ini.')
        self.koin -= jumlah
    # Di dalam class model Mahasiswa pada models/mahasiswa.py

    @classmethod
    def get_leaderboard(cls, limit=10):
        """
        Menarik daftar mahasiswa diurutkan berdasarkan total_xp tertinggi.
        """
    # Contoh query jika menggunakan SQLAlchemy/Flask:
    # return cls.query.order_by(cls.total_xp.desc()).limit(limit).all()
    
    # Contoh query jika menggunakan Odoo ORM:
    # return cls.search([], order='total_xp desc', limit=limit)
    pass