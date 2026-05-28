{
    'name': 'Presensi',
    'version': '1.0',
    'depends': ['base', 'mahasiswa'],
    'data': [
        'security/ir.model.access.csv',
        'views/presensi_views.xml',
    ],
    'installable': True,
    'application': True,
}