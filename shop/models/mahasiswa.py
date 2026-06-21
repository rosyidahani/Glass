from odoo import models, fields, api

class Mahasiswa(models.Model):
    _inherit = 'mahasiswa.mahasiswa'

    equipped_avatar_id = fields.Many2one(
        'shop.avatar', 
        string='Avatar Terpasang'
    )
    owned_avatar_ids = fields.Many2many(
        'shop.avatar',
        'mahasiswa_owned_avatars_rel',
        'mahasiswa_id',
        'avatar_id',
        string='Avatar Dimiliki'
    )
    shop_transaction_ids = fields.One2many(
        'shop.transaction', 
        'mahasiswa_id', 
        string='Transaksi Toko'
    )

    @api.model_create_multi
    def create(self, vals_list):
        records = super(Mahasiswa, self).create(vals_list)
        # Berikan avatar default saat mahasiswa pertama kali dibuat
        default_avatar = self.env['shop.avatar'].sudo().search([('avatar_id', '=', 'char_default')], limit=1)
        if default_avatar:
            for rec in records:
                rec.sudo().write({
                    'owned_avatar_ids': [(4, default_avatar.id)],
                    'equipped_avatar_id': default_avatar.id
                })
        return records
