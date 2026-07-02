import xmlrpc.client
import hashlib

def update_email_via_xmlrpc():
    """Update email for mahasiswa NIM 2411501008 using Odoo XML-RPC"""
    
    # Odoo connection parameters
    odoo_url = 'http://localhost:8069'  # Sesuaikan dengan URL Odoo Anda
    db = 'marchendise_ti'
    username = 'admin'
    password = 'admin'  # Sesuaikan password Anda
    
    try:
        # Koneksi ke Odoo
        common = xmlrpc.client.ServerProxy(f'{odoo_url}/xmlrpc/2/common')
        uid = common.authenticate(db, username, password, {})
        
        if not uid:
            print("❌ Authentication failed!")
            return
        
        print(f"✅ Authentication successful. UID: {uid}")
        
        models = xmlrpc.client.ServerProxy(f'{odoo_url}/xmlrpc/2/object')
        
        # Cari mahasiswa dengan NIM 2411501008
        nim = '2411501008'
        email = 'afandiirawan0216@gmail.com'
        
        mahasiswa_ids = models.execute_kw(
            db, uid, password, 
            'mahasiswa.mahasiswa', 'search',
            [[('nim', '=', nim)]]
        )
        
        if not mahasiswa_ids:
            print(f"❌ Mahasiswa dengan NIM {nim} tidak ditemukan!")
            return
        
        mahasiswa_id = mahasiswa_ids[0]
        print(f"📌 Found mahasiswa ID: {mahasiswa_id}")
        
        # Update email
        models.execute_kw(
            db, uid, password,
            'mahasiswa.mahasiswa', 'write',
            [mahasiswa_id, {'email': email}]
        )
        
        print(f"✅ Email berhasil diupdate ke: {email}")
        
        # Verifikasi
        mahasiswa = models.execute_kw(
            db, uid, password,
            'mahasiswa.mahasiswa', 'read',
            [mahasiswa_id],
            {'fields': ['nim', 'name', 'email']}
        )
        
        if mahasiswa:
            print(f"\n📋 Data After Update:")
            print(f"NIM: {mahasiswa[0]['nim']}")
            print(f"Nama: {mahasiswa[0]['name']}")
            print(f"Email: {mahasiswa[0]['email']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    update_email_via_xmlrpc()
