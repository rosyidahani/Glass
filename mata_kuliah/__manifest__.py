{
    'name': 'Mata Kuliah',
    'version': '1.0',
    'depends': ['base', 'mahasiswa'],
    'data': [
        'security/ir.model.access.csv',
        'views/mata_kuliah_views.xml',
    ],
    'installable': True,
    'application': True,
}