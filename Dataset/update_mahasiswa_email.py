import psycopg2

def update_mahasiswa_email():
    conn_param = "dbname='marchendise_ti' user='odoo' host='localhost' port='5432' password='odoopwd'"
    try:
        conn = psycopg2.connect(conn_param)
        cur = conn.cursor()
        
        # Update email untuk NIM 2411501008
        email = 'afandiirawan0216@gmail.com'
        nim = '2411501008'
        
        cur.execute(
            "UPDATE mahasiswa_mahasiswa SET email = %s WHERE nim = %s;",
            (email, nim)
        )
        conn.commit()
        
        print(f"✅ Successfully updated email for NIM {nim} to: {email}")
        print(f"Rows affected: {cur.rowcount}")
        
        # Verify the update
        cur.execute("SELECT nim, name, email FROM mahasiswa_mahasiswa WHERE nim = %s;", (nim,))
        result = cur.fetchone()
        if result:
            nim_result, name, email_result = result
            print(f"\n📋 Data After Update:")
            print(f"NIM: {nim_result}")
            print(f"Nama: {name}")
            print(f"Email: {email_result}")
        
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    update_mahasiswa_email()
