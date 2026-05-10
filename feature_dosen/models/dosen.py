from odoo import models, fields

class Dosen(models.Model):
    _name = 'feature.dosen'
    _description = 'Data Dosen'

    name = fields.Char(string='Nama Lengkap', required=True)
    nip = fields.Char(string='NIP', required=True)
    gender = fields.Selection([
        ('pria', 'Pria'),
        ('wanita', 'Wanita')
    ], string='Jenis Kelamin', default='pria')
    email = fields.Char(string='Email')
    telepon = fields.Char(string='Nomor Telepon')
    alamat = fields.Text(string='Alamat')
    spesialisasi = fields.Char(string='Bidang Keahlian')
    description = fields.Text(string='Catatan Internal')