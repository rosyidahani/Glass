from odoo.http import request


def get_active_mahasiswa():
    """Get currently logged in mahasiswa from session.
    Returns: recordset of mahasiswa if valid, else None.
    """
    mahasiswa_id = request.session.get('mahasiswa_id')
    if not mahasiswa_id:
        return None
    mahasiswa = request.env['mahasiswa.mahasiswa'].sudo().browse(mahasiswa_id)
    if not mahasiswa.exists():
        request.session.pop('mahasiswa_id', None)
        request.session.pop('mahasiswa_nim', None)
        request.session.pop('mahasiswa_name', None)
        return None
    return mahasiswa


def get_active_dosen():
    """Get currently logged in dosen from session.
    Returns: recordset of dosen if valid, else None.
    """
    dosen_id = request.session.get('dosen_id')
    if not dosen_id:
        return None
    dosen = request.env['feature.dosen'].sudo().browse(dosen_id)
    if not dosen.exists():
        request.session.pop('dosen_id', None)
        request.session.pop('dosen_nip', None)
        request.session.pop('dosen_name', None)
        return None
    return dosen
