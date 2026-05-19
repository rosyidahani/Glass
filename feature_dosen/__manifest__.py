{
    'name': 'Feature Dosen',
    'version': '1.0',
    'summary': 'Modul untuk manajemen data dosen',
    'description': 'Modul ini digunakan untuk mencatat data profil dosen.',
    'category': 'Education',
    'author': 'Your Name',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/dosen_views.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}