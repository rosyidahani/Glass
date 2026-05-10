{
    'name': 'Custom Web App',
    'version': '1.2',
    'summary': 'Custom web portal with student authentication',
<<<<<<< HEAD
    'depends': ['website', 'mahasiswa', 'feature_dosen'],
=======
    'depends': ['website', 'mahasiswa'],
>>>>>>> a7fb560f2b89bac0588d027908ef36e3540408bd
    'data': [
        'security/ir.model.access.csv',
        'views/layout.xml',
        'views/pages/login.xml',
<<<<<<< HEAD
        'views/pages/mahasiswa/dashboard.xml',
        'views/pages/dosen/dashboard.xml',
=======
        'views/pages/dashboard.xml',
>>>>>>> a7fb560f2b89bac0588d027908ef36e3540408bd
        'views/pages/menu.xml',
        'views/pages/submenu.xml',
    ],
    'installable': True,
    'application': True,
}
