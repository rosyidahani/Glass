import psycopg2

db_host = 'localhost'
db_user = 'odoo'
db_password = 'odoopwd'
db_port = 5432
db_name = 'MercandiseTI'

def insert_mahasiswa_with_email():
    """Insert mahasiswa NIM 2411501008 with email to database"""
    try:
        conn = psycopg2.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            port=db_port,
            database=db_name
        )
        cur = conn.cursor()
        
        # Data from CSV
        name = 'Moh. Afandi Irawan'
        nim = '2411501008'
        semester = 4
        prodi = 'Teknologi Informasi'
        total_xp = 0
        koin = 0
        password = '123456'  # Raw password, will be hashed by Odoo
        email = 'afandiirawan0216@gmail.com'
        active = True
        
        # For now, insert with raw password. Odoo will handle hashing
        # Note: This is just for testing. In production, password should be hashed.
        
        print(f"📝 Inserting mahasiswa data:")
        print(f"  NIM: {nim}")
        print(f"  Nama: {name}")
        print(f"  Email: {email}")
        print(f"  Prodi: {prodi}")
        print(f"  Semester: {semester}")
        
        # Get max ID
        cur.execute("SELECT MAX(id) FROM mahasiswa_mahasiswa;")
        max_id = cur.fetchone()[0] or 0
        new_id = max_id + 1
        
        # Insert mahasiswa
        cur.execute("""
            INSERT INTO mahasiswa_mahasiswa 
            (id, name, nim, semester, prodi, total_xp, koin, password, email, active, create_uid, create_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        """, (new_id, name, nim, semester, prodi, total_xp, koin, password, email, active, 2))
        
        conn.commit()
        
        # Verify insert
        cur.execute(
            "SELECT id, nim, name, email, active FROM mahasiswa_mahasiswa WHERE nim = %s;",
            (nim,)
        )
        result = cur.fetchone()
        
        if result:
            print(f"\n✅ Mahasiswa inserted successfully!")
            print(f"  ID: {result[0]}")
            print(f"  NIM: {result[1]}")
            print(f"  Nama: {result[2]}")
            print(f"  Email: {result[3]}")
            print(f"  Active: {result[4]}")
        else:
            print(f"❌ Insert failed!")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    insert_mahasiswa_with_email()
