import psycopg2

# Odoo database credentials from config
db_host = 'localhost'
db_user = 'odoo'
db_password = 'odoopwd'
db_port = 5432
db_name = 'MercandiseTI'

def add_email_column_and_update():
    """Add email column to mahasiswa_mahasiswa table if it doesn't exist, then update"""
    try:
        conn = psycopg2.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            port=db_port,
            database=db_name
        )
        cur = conn.cursor()
        
        # Check if email column exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'mahasiswa_mahasiswa' 
                AND column_name = 'email'
            );
        """)
        
        email_exists = cur.fetchone()[0]
        
        if not email_exists:
            print("📝 Adding email column to mahasiswa_mahasiswa table...")
            cur.execute("ALTER TABLE mahasiswa_mahasiswa ADD COLUMN email VARCHAR(255);")
            conn.commit()
            print("✅ Email column added successfully!")
        else:
            print("✅ Email column already exists!")
        
        # Now update email for NIM 2411501008
        nim = '2411501008'
        email = 'afandiirawan0216@gmail.com'
        
        # Check if record exists
        cur.execute(
            "SELECT id, nim, name FROM mahasiswa_mahasiswa WHERE nim = %s LIMIT 1;",
            (nim,)
        )
        result = cur.fetchone()
        
        if result:
            rec_id, rec_nim, name = result
            print(f"\n📋 Found record:")
            print(f"  ID: {rec_id}")
            print(f"  NIM: {rec_nim}")
            print(f"  Nama: {name}")
            
            # Update email
            cur.execute(
                "UPDATE mahasiswa_mahasiswa SET email = %s WHERE nim = %s;",
                (email, nim)
            )
            conn.commit()
            
            # Verify update
            cur.execute(
                "SELECT nim, name, email FROM mahasiswa_mahasiswa WHERE nim = %s LIMIT 1;",
                (nim,)
            )
            updated = cur.fetchone()
            if updated:
                print(f"\n✅ Email updated successfully!")
                print(f"  NIM: {updated[0]}")
                print(f"  Nama: {updated[1]}")
                print(f"  Email: {updated[2]}")
        else:
            print(f"❌ Record with NIM {nim} not found!")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    add_email_column_and_update()
