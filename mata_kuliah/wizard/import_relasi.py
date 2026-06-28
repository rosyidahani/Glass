import csv
import io
import base64
from odoo import models, fields, api
from odoo.exceptions import UserError

class ImportRelasiMataKuliah(models.TransientModel):
    _name = 'import.relasi.mata.kuliah'
    _description = 'Import Relasi Mata Kuliah'

    import_type = fields.Selection([
        ('mahasiswa', 'Mahasiswa ke Mata Kuliah'),
        ('dosen', 'Dosen ke Mata Kuliah')
    ], string='Tipe Import', default='mahasiswa', required=True)
    
    file_data = fields.Binary(string='File CSV')
    file_name = fields.Char(string='Nama File')

    def action_download_template(self):
        self.ensure_one()
        if self.import_type == 'mahasiswa':
            content = "nim,kode_matkul\n1234567,MK001\n2345678,MK002\n"
            filename = "template_import_mahasiswa_matkul.csv"
        else:
            content = "nip,kode_matkul\n9876543,MK001\n8765432,MK002\n"
            filename = "template_import_dosen_matkul.csv"
            
        attachment = self.env['ir.attachment'].sudo().create({
            'name': filename,
            'datas': base64.b64encode(content.encode('utf-8')),
            'type': 'binary',
        })
        return {
            'type': 'ir.actions.act_url',
            'url': f'/web/content/{attachment.id}?download=true',
            'target': 'new',
        }

    def action_import(self):
        self.ensure_one()
        if not self.file_data:
            raise UserError("Silakan pilih file CSV terlebih dahulu.")
            
        try:
            csv_data = base64.b64decode(self.file_data).decode('utf-8')
        except Exception:
            raise UserError("File tidak valid atau bukan format UTF-8.")
            
        reader = csv.DictReader(io.StringIO(csv_data))
        
        success_count = 0
        error_logs = []
        
        if self.import_type == 'mahasiswa':
            for row in reader:
                nim = row.get('nim')
                kode_matkul = row.get('kode_matkul')
                if not nim or not kode_matkul:
                    continue
                
                student = self.env['mahasiswa.mahasiswa'].search([('nim', '=', nim.strip())], limit=1)
                course = self.env['mata.kuliah'].search([('kode', '=', kode_matkul.strip())], limit=1)
                
                if not student:
                    error_logs.append(f"Mahasiswa dengan NIM '{nim}' tidak ditemukan.")
                    continue
                if not course:
                    error_logs.append(f"Mata Kuliah dengan Kode '{kode_matkul}' tidak ditemukan.")
                    continue
                    
                student.write({'mata_kuliah_ids': [(4, course.id)]})
                success_count += 1
        else:
            for row in reader:
                nip = row.get('nip')
                kode_matkul = row.get('kode_matkul')
                if not nip or not kode_matkul:
                    continue
                
                dosen = self.env['feature.dosen'].search([('nip', '=', nip.strip())], limit=1)
                course = self.env['mata.kuliah'].search([('kode', '=', kode_matkul.strip())], limit=1)
                
                if not dosen:
                    error_logs.append(f"Dosen dengan NIP '{nip}' tidak ditemukan.")
                    continue
                if not course:
                    error_logs.append(f"Mata Kuliah dengan Kode '{kode_matkul}' tidak ditemukan.")
                    continue
                    
                course.write({'dosen_ids': [(4, dosen.id)]})
                success_count += 1
                
        message = f"Berhasil mengimpor {success_count} data relasi."
        if error_logs:
            message += "\n\nBeberapa kesalahan terjadi:\n" + "\n".join(error_logs[:10])
            if len(error_logs) > 10:
                message += f"\n...dan {len(error_logs) - 10} kesalahan lainnya."
                
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Hasil Import',
                'message': message,
                'sticky': True,
                'type': 'warning' if error_logs else 'success',
            }
        }
