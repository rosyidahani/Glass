import psycopg2
from psycopg2 import sql

# Odoo database credentials from config
db_host = 'localhost'
db_user = 'odoo'
db_password = 'odoopwd'
db_port = 5432

def find_and_update_email():
    """Connect to PostgreSQL and find available databases, then update email"""
    try:
        # First, connect to PostgreSQL server to list databases
        conn = psycopg2.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            port=db_port,
            database='postgres'
        )
        cur = conn.cursor()
        
        # List all databases
        cur.execute("SELECT datname FROM pg_database WHERE datistemplate = false AND datname != 'postgres';")
        databases = cur.fetchall()
        
        print("🗄️  Available PostgreSQL databases:")
        for db_tuple in databases:
            db_name = db_tuple[0]
            print(f"  Testing: {db_name} (lowercase: '{db_name.lower()}')")
            # Try all databases except postgres
            if db_name.lower() != 'postgres':
                
                try:
                    # Try to connect to this database
                    test_conn = psycopg2.connect(
                        host=db_host,
                        user=db_user,
                        password=db_password,
                        port=db_port,
                        database=db_name
                    )
                    test_cur = test_conn.cursor()
                    
                    # Check if mahasiswa table exists
                    test_cur.execute("""
                        SELECT EXISTS (
                            SELECT FROM pg_tables 
                            WHERE tablename = 'mahasiswa_mahasiswa'
                        );
                    """)
                    
                    has_table = test_cur.fetchone()[0]
                    if has_table:
                        print(f"    └─ ✅ Found mahasiswa_mahasiswa table!")
                        
                        # Try to update email for NIM 2411501008
                        nim = '2411501008'
                        email = 'afandiirawan0216@gmail.com'
                        
                        # First check if record exists
                        test_cur.execute(
                            "SELECT id, nim, name, email FROM mahasiswa_mahasiswa WHERE nim = %s LIMIT 1;",
                            (nim,)
                        )
                        result = test_cur.fetchone()
                        
                        if result:
                            rec_id, rec_nim, name, old_email = result
                            print(f"    └─ Found record: ID={rec_id}, Name={name}, Old Email={old_email}")
                            
                            # Update email
                            test_cur.execute(
                                "UPDATE mahasiswa_mahasiswa SET email = %s WHERE nim = %s;",
                                (email, nim)
                            )
                            test_conn.commit()
                            
                            # Verify update
                            test_cur.execute(
                                "SELECT nim, name, email FROM mahasiswa_mahasiswa WHERE nim = %s LIMIT 1;",
                                (nim,)
                            )
                            updated = test_cur.fetchone()
                            if updated:
                                print(f"    └─ ✅ Updated successfully!")
                                print(f"    └─ NIM: {updated[0]}")
                                print(f"    └─ Nama: {updated[1]}")
                                print(f"    └─ Email: {updated[2]}")
                                return True
                        else:
                            print(f"    └─ ⚠️  Record with NIM {nim} not found in this database")
                    
                    test_cur.close()
                    test_conn.close()
                    
                except Exception as e:
                    print(f"    └─ Could not access: {e}")
            else:
                print(f"  - {db_name}")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error connecting to PostgreSQL: {e}")

if __name__ == "__main__":
    find_and_update_email()
