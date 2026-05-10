{
    'name': 'Mahasiswa',
    'version': '1.0',
    'summary': 'Modul pengelolaan data mahasiswa',
    'description': 'Mengelola data mahasiswa termasuk NIM, foto profil, XP, koin, dan semester.',
    'author': 'Custom',
    'category': 'Education',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/mahasiswa_views.xml',
    ],
    'demo': [
        'data/mahasiswa_demo.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
