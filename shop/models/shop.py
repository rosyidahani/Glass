from odoo import models, fields, api
import random
import re
import io
import base64
from PIL import Image

def _compress_avatar_image(base64_data, max_size=(512, 512), quality=85):
    if not base64_data:
        return base64_data
    try:
        if isinstance(base64_data, str):
            base64_bytes = base64_data.encode('utf-8')
        else:
            base64_bytes = base64_data
            
        img_bytes = base64.b64decode(base64_bytes)
        img = Image.open(io.BytesIO(img_bytes))
        
        fmt = img.format if img.format else 'PNG'
        
        if img.width > max_size[0] or img.height > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
        output = io.BytesIO()
        if fmt == 'JPEG' or fmt == 'JPG':
            img.save(output, format='JPEG', quality=quality, optimize=True)
        else:
            img.save(output, format='PNG', optimize=True)
            
        return base64.b64encode(output.getvalue()).decode('utf-8')
    except Exception:
        return base64_data

class ShopAvatar(models.Model):
    _name = 'shop.avatar'
    _description = 'Sub Modul Avatar'
    _rec_name = 'nama_avatar'

    custom_avatar_id = fields.Boolean(string='Kustomisasi ID Manual', default=False)
    avatar_id = fields.Char(string='ID Avatar', compute='_compute_avatar_id', store=True, readonly=False)
    nama_avatar = fields.Char(string='Nama Avatar', required=True)
    harga_koin = fields.Integer(string='Harga Koin', default=0)
    gambar_url = fields.Char(string='URL Gambar / Path Aset')
    
    # Pendukung Upload File Gambar
    foto_avatar = fields.Image(string='Upload Gambar Avatar', max_width=512, max_height=512)
    image_src = fields.Char(string='Sumber Gambar', compute='_compute_image_src')
    active = fields.Boolean(string='Aktif', default=True)

    _sql_constraints = [
        ('avatar_id_unique', 'UNIQUE(avatar_id)', 'ID Avatar sudah terdaftar!'),
    ]

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('foto_avatar'):
                vals['foto_avatar'] = _compress_avatar_image(vals['foto_avatar'])
        return super(ShopAvatar, self).create(vals_list)

    def write(self, vals):
        if vals.get('foto_avatar'):
            vals['foto_avatar'] = _compress_avatar_image(vals['foto_avatar'])
        return super(ShopAvatar, self).write(vals)

    @api.depends('nama_avatar', 'custom_avatar_id')
    def _compute_avatar_id(self):
        for rec in self:
            if not rec.custom_avatar_id:
                if rec.nama_avatar:
                    # Slugify nama avatar: ubah ke lowercase, ganti karakter non-alfanumerik dengan underscore
                    slug = rec.nama_avatar.lower().strip()
                    slug = re.sub(r'[^a-z0-9_]+', '_', slug)
                    slug = re.sub(r'_+', '_', slug).strip('_')
                    rec.avatar_id = f"avatar_{slug}"
                else:
                    rec.avatar_id = False

    @api.depends('gambar_url', 'foto_avatar', 'avatar_id')
    def _compute_image_src(self):
        for rec in self:
            if rec.foto_avatar:
                rec.image_src = f"/avatar/image/{rec.id}"
            elif rec.gambar_url:
                rec.image_src = rec.gambar_url
            else:
                rec.image_src = f"/custom_web/static/src/img/{rec.avatar_id or 'char_default'}.png"



class ShopVoucher(models.Model):
    _name = 'shop.voucher'
    _description = 'Voucher Toko'
    _rec_name = 'name'

    name = fields.Char(string='Nama Voucher', required=True)
    code = fields.Char(string='Kode Unik', required=True, help='Contoh: v_canteen, v_library')
    price = fields.Integer(string='Harga Koin', default=0)
    active = fields.Boolean(string='Aktif', default=True)
    voucher_prefix = fields.Char(string='Prefix Voucher', help='Contoh: WIF, CAN (untuk generate kupon)')
    description = fields.Text(string='Deskripsi')

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Kode unik voucher sudah terdaftar!'),
    ]


class ShopTransaction(models.Model):
    _name = 'shop.transaction'
    _description = 'Transaksi Pembelian Toko'
    _order = 'purchase_date desc'

    mahasiswa_id = fields.Many2one('mahasiswa.mahasiswa', string='Mahasiswa', required=True, ondelete='cascade')
    item_type = fields.Selection([
        ('avatar', 'Avatar'),
        ('voucher', 'Voucher')
    ], string='Tipe Item', required=True, default='avatar')
    
    avatar_id = fields.Many2one('shop.avatar', string='Avatar')
    voucher_id = fields.Many2one('shop.voucher', string='Voucher')
    
    purchase_date = fields.Datetime(string='Tanggal Pembelian', default=fields.Datetime.now)
    code_generated = fields.Char(string='Kode Voucher', help='Kode kupon yang dihasilkan jika tipe item adalah voucher')
    status = fields.Selection([
        ('active', 'Aktif'),
        ('used', 'Sudah Digunakan')
    ], string='Status Penggunaan', default='active')

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('item_type') == 'voucher' and not vals.get('code_generated'):
                voucher_id = vals.get('voucher_id')
                if voucher_id:
                    voucher = self.env['shop.voucher'].browse(voucher_id)
                    prefix = voucher.voucher_prefix or 'VOU'
                else:
                    prefix = 'VOU'
                rand1 = random.randint(1000, 9999)
                rand2 = random.randint(100, 999)
                vals['code_generated'] = f"{prefix}-{rand1}-{rand2}"
        return super(ShopTransaction, self).create(vals_list)
