{
    'name': 'Shop Gamifikasi Mahasiswa',
    'version': '1.0',
    'summary': 'Sistem Toko Koin dan Pembelian Avatar/Voucher Mahasiswa',
    'description': 'Menyediakan model backend untuk item toko (avatar & voucher), riwayat transaksi, dan kepemilikan item oleh mahasiswa.',
    'author': 'Custom',
    'category': 'Education',
    'depends': ['mahasiswa'],
    'data': [
        'security/ir.model.access.csv',
        'data/shop_data.xml',
        'views/shop_views.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
