import psycopg2

db_host = 'localhost'
db_user = 'odoo'
db_password = 'odoopwd'
db_port = 5432
db_name = 'MercandiseTI'

def debug_email_search():
    """Debug why email search is failing"""
    try:
        conn = psycopg2.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            port=db_port,
            database=db_name
        )
        cur = conn.cursor()
        
        email_to_search = 'afandiirawan0216@gmail.com'
        
        print(f"🔍 Debugging email search for: {email_to_search}\n")
        
        # Check all mahasiswa records
        cur.execute("SELECT id, nim, name, email, active FROM mahasiswa_mahasiswa;")
        records = cur.fetchall()
        
        print("📋 All mahasiswa records in database:")
        for rec in records:
            print(f"  ID: {rec[0]}")
            print(f"    NIM: {rec[1]}")
            print(f"    Name: {rec[2]}")
            print(f"    Email: {rec[3]} (type: {type(rec[3]).__name__})")
            print(f"    Active: {rec[4]}")
            print()
        
        # Try the exact query from auth.py
        print(f"\n🔎 Testing exact query from auth.py:")
        print(f"  WHERE email = '{email_to_search}' AND active = True")
        
        cur.execute(
            "SELECT id, nim, name, email, active FROM mahasiswa_mahasiswa WHERE email = %s AND active = True;",
            (email_to_search,)
        )
        result = cur.fetchone()
        
        if result:
            print(f"  ✅ Query FOUND record!")
            print(f"     ID: {result[0]}, NIM: {result[1]}, Email: {result[2]}")
        else:
            print(f"  ❌ Query DID NOT FIND record")
            
            # Try without active condition
            print(f"\n🔎 Testing without active condition:")
            cur.execute(
                "SELECT id, nim, name, email, active FROM mahasiswa_mahasiswa WHERE email = %s;",
                (email_to_search,)
            )
            result = cur.fetchone()
            if result:
                print(f"  ✅ Found when ignoring active!")
                print(f"     Active value: {result[4]} (type: {type(result[4]).__name__})")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_email_search()
