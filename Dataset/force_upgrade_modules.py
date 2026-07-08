import psycopg2

db_host = 'localhost'
db_user = 'openpg'
db_password = 'koentji'
db_port = 5432
db_name = 'Glass'

def force_upgrade_modules():
    """Force upgrade of modules in Odoo database"""
    try:
        conn = psycopg2.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            port=db_port,
            database=db_name
        )
        cur = conn.cursor()
        
        print("Forcing module upgrade state...\n")
        
        # Set mahasiswa module to 'to upgrade' state
        cur.execute("""
            UPDATE ir_module_module 
            SET state = 'to upgrade' 
            WHERE name = 'mahasiswa';
        """)
        conn.commit()
        print("[OK] Set mahasiswa module to 'to upgrade'")
        
        # Set feature_dosen module to 'to upgrade' state
        cur.execute("""
            UPDATE ir_module_module 
            SET state = 'to upgrade' 
            WHERE name = 'feature_dosen';
        """)
        conn.commit()
        print("[OK] Set feature_dosen module to 'to upgrade'")
        
        # Set custom_web module to 'to upgrade' state
        cur.execute("""
            UPDATE ir_module_module 
            SET state = 'to upgrade' 
            WHERE name = 'custom_web';
        """)
        conn.commit()
        print("[OK] Set custom_web module to 'to upgrade'")

        # Set presensi module to 'to upgrade' state
        cur.execute("""
            UPDATE ir_module_module 
            SET state = 'to upgrade' 
            WHERE name = 'presensi';
        """)
        conn.commit()
        print("[OK] Set presensi module to 'to upgrade'")
        
        print("\nNext step:")
        print("   1. Restart Odoo service or restart Odoo server")
        print("   2. Odoo will automatically upgrade these modules on startup")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    force_upgrade_modules()
