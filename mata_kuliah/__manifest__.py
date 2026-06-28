{
    'name': 'Mata Kuliah',
    'version': '1.0',
    'depends': ['base', 'mahasiswa', 'feature_dosen'],
    'data': [
        'security/ir.model.access.csv',
        'views/mata_kuliah_views.xml',
        'wizard/import_relasi_view.xml',
    ],
    'installable': True,
    'application': True,
}