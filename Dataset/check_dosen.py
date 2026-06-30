import psycopg2

def check_dosen():
    conn_param = "dbname='marchendise_ti' user='odoo' host='localhost' port='5432' password='odoopwd'"
    try:
        conn = psycopg2.connect(conn_param)
        cur = conn.cursor()
        cur.execute("SELECT nip, name, password FROM feature_dosen;")
        records = cur.fetchall()
        print("=== DATA DOSEN DI DATABASE ===")
        for nip, name, password in records:
            print(f"Nama: {name} | NIP: {nip} | Password: {repr(password)}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_dosen()
