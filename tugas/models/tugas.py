from odoo import models, fields


class Tugas(models.Model):
    _name = 'tugas.tugas'
    _description = 'Tugas Mata Kuliah'
    _rec_name = 'judul'

    judul = fields.Char('Judul Tugas', required=True)
    mata_kuliah_id = fields.Many2one('mata.kuliah', string='Mata Kuliah', required=True)
    dosen_id = fields.Many2one('feature.dosen', string='Dosen Pembuat')
    jenis_tugas = fields.Char('Jenis Tugas', required=True)
    deskripsi = fields.Text('Deskripsi Tugas')
    deadline = fields.Datetime('Batas Waktu', required=True)
    file_materi = fields.Binary('File Lampiran Materi')
    file_materi_name = fields.Char('Nama File Lampiran')
    
    pengumpulan_ids = fields.One2many('tugas.pengumpulan', 'tugas_id', string='Daftar Pengumpulan')

    def init(self):
        super(Tugas, self).init()
        # Clean up old selection metadata from ir_model_fields_selection directly in DB
        # to prevent Odoo's unlinker from triggering base unlinking crash on Char fields.
        self.env.cr.execute("""
            DELETE FROM ir_model_fields_selection 
            WHERE field_id IN (
                SELECT id FROM ir_model_fields 
                WHERE name = 'jenis_tugas' AND model = 'tugas.tugas'
            )
        """)


class PengumpulanTugas(models.Model):
    _name = 'tugas.pengumpulan'
    _description = 'Pengumpulan Tugas Mahasiswa'

    tugas_id = fields.Many2one('tugas.tugas', string='Tugas', required=True, ondelete='cascade')
    mahasiswa_id = fields.Many2one('mahasiswa.mahasiswa', string='Mahasiswa', required=True)
    waktu_kumpul = fields.Datetime('Waktu Kumpul', default=fields.Datetime.now)
    tipe_file = fields.Selection([('zip', 'File ZIP/PDF'), ('link', 'Tautan/Link')], string='Tipe Pengumpulan')
    file_jawaban = fields.Binary('File Jawaban')
    file_jawaban_name = fields.Char('Nama File Jawaban')
    link_jawaban = fields.Char('Tautan Jawaban')
    catatan = fields.Text('Catatan Mahasiswa')
    
    nilai = fields.Integer('Nilai', default=0)
    status_penilaian = fields.Selection([('pending', 'Belum Dinilai'), ('graded', 'Sudah Dinilai')], default='pending')
    koin_didapat = fields.Integer('Koin Didapat', default=0)
    xp_didapat = fields.Integer('XP Didapat', default=0)

    def write(self, vals):
        for rec in self:
            old_status = rec.status_penilaian
            old_koin = rec.koin_didapat
            old_xp = rec.xp_didapat

            new_status = vals.get('status_penilaian', old_status)
            new_nilai = vals.get('nilai', rec.nilai)

            if new_status == 'graded':
                new_koin = 0
                if 80 <= new_nilai <= 100:
                    new_koin = 5
                elif 60 <= new_nilai <= 79:
                    new_koin = 3
                elif 1 <= new_nilai <= 59:
                    new_koin = 1
                else:
                    new_koin = 0
                
                new_xp = new_koin * 5
                
                diff_koin = new_koin - old_koin
                diff_xp = new_xp - old_xp

                if rec.mahasiswa_id:
                    rec.mahasiswa_id.sudo().write({
                        'koin': rec.mahasiswa_id.koin + diff_koin,
                        'total_xp': rec.mahasiswa_id.total_xp + diff_xp
                    })
                
                vals['koin_didapat'] = new_koin
                vals['xp_didapat'] = new_xp
                
            elif new_status == 'pending' and old_status == 'graded':
                if rec.mahasiswa_id:
                    rec.mahasiswa_id.sudo().write({
                        'koin': max(0, rec.mahasiswa_id.koin - old_koin),
                        'total_xp': max(0, rec.mahasiswa_id.total_xp - old_xp)
                    })
                vals['koin_didapat'] = 0
                vals['xp_didapat'] = 0

        return super(PengumpulanTugas, self).write(vals)