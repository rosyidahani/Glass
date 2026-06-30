import psycopg2

def set_passwords():
    conn_param = "dbname='marchendise_ti' user='odoo' host='localhost' port='5432' password='odoopwd'"
    try:
        conn = psycopg2.connect(conn_param)
        cur = conn.cursor()
        cur.execute("UPDATE feature_dosen SET password = '123456' WHERE password IS NULL OR password = '';")
        conn.commit()
        print(f"Successfully set default password '123456' for {cur.rowcount} lecturers.")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    set_passwords()
