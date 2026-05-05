{
    'name': 'Custom Web App',
    'version': '1.2',
    'summary': 'Custom web portal with student authentication',
    'depends': ['website', 'mahasiswa'],
    'data': [
        'security/ir.model.access.csv',
        'views/layout.xml',
        'views/pages/login.xml',
        'views/pages/dashboard.xml',
        'views/pages/menu.xml',
        'views/pages/submenu.xml',
    ],
    'installable': True,
    'application': True,
}
