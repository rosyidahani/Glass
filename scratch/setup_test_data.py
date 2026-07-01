import psycopg2

def setup():
    conn_param = "dbname='marchendise_ti' user='odoo' host='localhost' port='5432' password='odoopwd'"
    try:
        conn = psycopg2.connect(conn_param)
        cur = conn.cursor()
        
        # Select all students
        cur.execute("SELECT id, nim, name FROM mahasiswa_mahasiswa;")
        students = cur.fetchall()
        print("Students:")
        for s in students:
            print(s)
            
        if students:
            first_student_id = students[0][0]
            cur.execute("UPDATE mahasiswa_mahasiswa SET email = 'test_mhs@gmail.com' WHERE id = %s;", (first_student_id,))
            print(f"Set email for student ID {first_student_id} to test_mhs@gmail.com.")
        
        # Set email for dosen
        cur.execute("UPDATE feature_dosen SET email = 'test_dosen@gmail.com' WHERE nip = '8910221611407';")
        print(f"Set email for {cur.rowcount} lecturer.")
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    setup()
