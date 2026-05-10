<<<<<<< HEAD
from odoo import models, fields, api
=======
from odoo import models, fields
>>>>>>> a7fb560f2b89bac0588d027908ef36e3540408bd

class Dosen(models.Model):
    _name = 'feature.dosen'
    _description = 'Data Dosen'

    name = fields.Char(string='Nama Lengkap', required=True)
    nip = fields.Char(string='NIP', required=True)
<<<<<<< HEAD
    password = fields.Char(string='Password')
=======
>>>>>>> a7fb560f2b89bac0588d027908ef36e3540408bd
    gender = fields.Selection([
        ('pria', 'Pria'),
        ('wanita', 'Wanita')
    ], string='Jenis Kelamin', default='pria')
    email = fields.Char(string='Email')
    telepon = fields.Char(string='Nomor Telepon')
    alamat = fields.Text(string='Alamat')
    spesialisasi = fields.Char(string='Bidang Keahlian')
<<<<<<< HEAD
    description = fields.Text(string='Catatan Internal')

    @api.model
    def authenticate_nip(self, nip, password):
        dosen = self.search([('nip', '=', nip), ('password', '=', password)], limit=1)
        return dosen
=======
    description = fields.Text(string='Catatan Internal')
>>>>>>> a7fb560f2b89bac0588d027908ef36e3540408bd
