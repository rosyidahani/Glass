import psycopg2

db_host = 'localhost'
db_user = 'openpg'
db_password = 'koentji'
db_port = 5432
db_name = 'Glass'

def update_database():
    try:
        conn = psycopg2.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            port=db_port,
            database=db_name
        )
        cur = conn.cursor()
        
        # 1. Add email column to mahasiswa_mahasiswa if not exists
        print("Checking email column in mahasiswa_mahasiswa table...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='mahasiswa_mahasiswa' AND column_name='email';
        """)
        exists = cur.fetchone()
        
        if not exists:
            cur.execute("ALTER TABLE mahasiswa_mahasiswa ADD COLUMN email VARCHAR;")
            conn.commit()
            print("[OK] Column 'email' successfully added to mahasiswa_mahasiswa.")
        else:
            print("[INFO] Column 'email' already exists.")
            
        # 2. Mark modules for upgrade
        modules = ['mahasiswa', 'feature_dosen', 'custom_web', 'presensi']
        print("\nMarking modules for upgrade in database 'Glass'...")
        for module in modules:
            cur.execute("""
                UPDATE ir_module_module 
                SET state = 'to upgrade' 
                WHERE name = %s;
            """, (module,))
            conn.commit()
            print(f"[OK] Set module '{module}' to 'to upgrade'")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    update_database()
