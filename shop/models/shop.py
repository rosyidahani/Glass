from odoo import models, fields, api
import random
import re

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

    _sql_constraints = [
        ('avatar_id_unique', 'UNIQUE(avatar_id)', 'ID Avatar sudah terdaftar!'),
    ]

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
                rec.image_src = f"/web/image?model=shop.avatar&id={rec.id}&field=foto_avatar"
            elif rec.gambar_url:
                rec.image_src = rec.gambar_url
            else:
                rec.image_src = f"/custom_web/static/src/img/{rec.avatar_id or 'char_default'}.png"


class ShopItem(models.Model):
    _name = 'shop.item'
    _description = 'Item Toko Koin'
    _rec_name = 'name'

    item_type = fields.Selection([
        ('avatar', 'Avatar'),
        ('voucher', 'Voucher')
    ], string='Tipe Item', required=True, default='avatar')
    
    avatar_id = fields.Many2one('shop.avatar', string='Referensi Avatar')

    name = fields.Char(string='Nama Item', compute='_compute_item_fields', store=True, readonly=False)
    code = fields.Char(string='Kode Unik Item', compute='_compute_item_fields', store=True, readonly=False, help='Contoh: char_cyber, v_wifi')
    price = fields.Integer(string='Harga Koin', compute='_compute_item_fields', store=True, readonly=False, default=0)
    
    description = fields.Text(string='Deskripsi Item')
    voucher_prefix = fields.Char(string='Prefix Voucher', help='Contoh: WIF, CAN (untuk generate kupon)')
    active = fields.Boolean(string='Aktif', default=True)

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Kode unik item sudah terdaftar!'),
    ]

    @api.depends('avatar_id', 'item_type', 'avatar_id.nama_avatar', 'avatar_id.harga_koin', 'avatar_id.avatar_id')
    def _compute_item_fields(self):
        for rec in self:
            if rec.item_type == 'avatar' and rec.avatar_id:
                rec.name = rec.avatar_id.nama_avatar
                rec.price = rec.avatar_id.harga_koin
                rec.code = rec.avatar_id.avatar_id
            else:
                rec.name = rec.name or ''
                rec.price = rec.price or 0
                rec.code = rec.code or ''

    @api.onchange('avatar_id', 'item_type')
    def _onchange_avatar_id(self):
        if self.item_type == 'avatar' and self.avatar_id:
            self.name = self.avatar_id.nama_avatar
            self.price = self.avatar_id.harga_koin
            self.code = self.avatar_id.avatar_id


class ShopTransaction(models.Model):
    _name = 'shop.transaction'
    _description = 'Transaksi Pembelian Toko'
    _order = 'purchase_date desc'

    mahasiswa_id = fields.Many2one('mahasiswa.mahasiswa', string='Mahasiswa', required=True, ondelete='cascade')
    item_id = fields.Many2one('shop.item', string='Item', required=True, ondelete='restrict')
    purchase_date = fields.Datetime(string='Tanggal Pembelian', default=fields.Datetime.now)
    code_generated = fields.Char(string='Kode Voucher', help='Kode kupon yang dihasilkan jika tipe item adalah voucher')
    status = fields.Selection([
        ('active', 'Aktif'),
        ('used', 'Sudah Digunakan')
    ], string='Status Penggunaan', default='active')

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            item = self.env['shop.item'].browse(vals.get('item_id'))
            if item.item_type == 'voucher' and not vals.get('code_generated'):
                prefix = item.voucher_prefix or 'VOU'
                rand1 = random.randint(1000, 9999)
                rand2 = random.randint(100, 999)
                vals['code_generated'] = f"{prefix}-{rand1}-{rand2}"
        return super(ShopTransaction, self).create(vals_list)
