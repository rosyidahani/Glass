from odoo import models, fields


class Tugas(models.Model):
    _name = 'tugas.tugas'
    _description = 'Tugas Mata Kuliah'
    _rec_name = 'judul'

    judul = fields.Char('Judul Tugas', required=True)
    mata_kuliah_id = fields.Many2one('mata.kuliah', string='Mata Kuliah', required=True)
    dosen_id = fields.Many2one('feature.dosen', string='Dosen Pembuat')
    jenis_tugas = fields.Selection([
        ('Individu', 'Individu'), 
        ('Kelompok', 'Kelompok')
    ], string='Jenis Tugas', required=True)
    deskripsi = fields.Text('Deskripsi Tugas')
    deadline = fields.Datetime('Batas Waktu', required=True)
    
    pengumpulan_ids = fields.One2many('tugas.pengumpulan', 'tugas_id', string='Daftar Pengumpulan')


class PengumpulanTugas(models.Model):
    _name = 'tugas.pengumpulan'
    _description = 'Pengumpulan Tugas Mahasiswa'

    tugas_id = fields.Many2one('tugas.tugas', string='Tugas', required=True, ondelete='cascade')
    mahasiswa_id = fields.Many2one('mahasiswa.mahasiswa', string='Mahasiswa', required=True)
    waktu_kumpul = fields.Datetime('Waktu Kumpul', default=fields.Datetime.now)
    tipe_file = fields.Selection([('zip', 'File ZIP/PDF'), ('link', 'Tautan/Link')], string='Tipe Pengumpulan')
    file_jawaban = fields.Binary('File Jawaban')
    link_jawaban = fields.Char('Tautan Jawaban')
    catatan = fields.Text('Catatan Mahasiswa')
    
    nilai = fields.Integer('Nilai', default=0)
    status_penilaian = fields.Selection([('pending', 'Belum Dinilai'), ('graded', 'Sudah Dinilai')], default='pending')