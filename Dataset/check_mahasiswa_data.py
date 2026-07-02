import psycopg2

db_host = 'localhost'
db_user = 'odoo'
db_password = 'odoopwd'
db_port = 5432
db_name = 'MercandiseTI'

def check_mahasiswa_data():
    """Check what data exists in mahasiswa_mahasiswa table"""
    try:
        conn = psycopg2.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            port=db_port,
            database=db_name
        )
        cur = conn.cursor()
        
        # Count records
        cur.execute("SELECT COUNT(*) FROM mahasiswa_mahasiswa;")
        count = cur.fetchone()[0]
        print(f"📊 Total records in mahasiswa_mahasiswa: {count}")
        
        # Show NIM 2411501008 search
        cur.execute(
            "SELECT id, nim, name FROM mahasiswa_mahasiswa WHERE nim = '2411501008' LIMIT 1;"
        )
        result = cur.fetchone()
        
        if result:
            print(f"\n✅ Found NIM 2411501008: {result}")
        else:
            print(f"\n❌ NIM 2411501008 not found")
            
            # Show first few records
            cur.execute(
                "SELECT id, nim, name FROM mahasiswa_mahasiswa LIMIT 5;"
            )
            records = cur.fetchall()
            print(f"\n📋 First 5 records in database:")
            for rec in records:
                print(f"  ID: {rec[0]}, NIM: {rec[1]}, Name: {rec[2]}")
        
        # Search for similar NIMs
        cur.execute(
            "SELECT id, nim, name FROM mahasiswa_mahasiswa WHERE nim LIKE '%2411501%' LIMIT 10;"
        )
        similar = cur.fetchall()
        print(f"\n🔍 Records with NIM pattern '%2411501%':")
        for rec in similar:
            print(f"  NIM: {rec[1]}, Name: {rec[2]}")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_mahasiswa_data()
