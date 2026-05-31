{
    'name': 'Manajemen Tugas Kuliah',
    'version': '1.0',
    'summary': 'Modul Backend Tugas Kuliah',
    'description': 'Menyediakan struktur database untuk fitur pembuatan dan pengumpulan tugas di portal web.',
    'category': 'Education',
    'author': 'Glass',
    'depends': ['base', 'mata_kuliah', 'feature_dosen', 'mahasiswa'],
    'data': [
        'security/ir.model.access.csv',
        'views/tugas_views.xml',
    ],
    'installable': True,
    'application': True,
}