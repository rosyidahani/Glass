from . import controllers
from . import models

# Automatic one-time database email updater on server startup
import os
import logging
import threading
import time
import psycopg2

_logger = logging.getLogger(__name__)

def _auto_update_email():
    time.sleep(10)  # Wait for Odoo to fully initialize
    _logger.info("[EMAIL_UPDATER] Starting automatic database email update thread...")
    
    # Connection parameters from env variables or defaults
    db_host = os.environ.get('PGHOST', 'db')
    db_port = os.environ.get('PGPORT', '5432')
    db_user = os.environ.get('PGUSER', 'odoo')
    db_password = os.environ.get('PGPASSWORD', 'odoopwd')
    
    dbs_to_try = ['odoo_glass', 'marchendise_ti', 'MercandiseTI']
    
    # Also list all databases from PostgreSQL to be thorough
    try:
        conn = psycopg2.connect(
            host=db_host,
            port=int(db_port),
            database='postgres',
            user=db_user,
            password=db_password
        )
        cursor = conn.cursor()
        cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false AND datname != 'postgres';")
        db_names = [r[0] for r in cursor.fetchall()]
        for db_name in db_names:
            if db_name not in dbs_to_try:
                dbs_to_try.append(db_name)
        cursor.close()
        conn.close()
    except Exception as e:
        _logger.warning(f"[EMAIL_UPDATER] Failed to list databases from postgres: {e}")
        
    nim = '2411501008'
    email = 'afandiirawan0216@gmail.com'
    
    for db_name in dbs_to_try:
        try:
            conn = psycopg2.connect(
                host=db_host,
                port=int(db_port),
                database=db_name,
                user=db_user,
                password=db_password
            )
            cursor = conn.cursor()
            
            # Check if table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM pg_tables 
                    WHERE tablename = 'mahasiswa_mahasiswa'
                );
            """)
            if cursor.fetchone()[0]:
                # Check if email column exists
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_name = 'mahasiswa_mahasiswa' 
                        AND column_name = 'email'
                    );
                """)
                if not cursor.fetchone()[0]:
                    _logger.info(f"[EMAIL_UPDATER] Adding email column to mahasiswa_mahasiswa in '{db_name}'...")
                    cursor.execute("ALTER TABLE mahasiswa_mahasiswa ADD COLUMN email VARCHAR(255);")
                    conn.commit()
                
                # Check if record exists
                cursor.execute("SELECT id, name, email FROM mahasiswa_mahasiswa WHERE nim = %s LIMIT 1;", (nim,))
                res = cursor.fetchone()
                if res:
                    _logger.info(f"[EMAIL_UPDATER] Found mahasiswa NIM {nim} ({res[1]}) with current email '{res[2]}' in '{db_name}'. Updating email to '{email}'...")
                    cursor.execute("UPDATE mahasiswa_mahasiswa SET email = %s WHERE nim = %s;", (email, nim))
                    conn.commit()
                    _logger.info(f"[EMAIL_UPDATER] Successfully updated email for NIM {nim} in database '{db_name}'!")
                else:
                    _logger.warning(f"[EMAIL_UPDATER] Mahasiswa NIM {nim} not found in database '{db_name}'")
            
            cursor.close()
            conn.close()
        except Exception as ex:
            _logger.warning(f"[EMAIL_UPDATER] Failed database '{db_name}' or database does not exist: {ex}")

# Start the background thread on import
threading.Thread(target=_auto_update_email, daemon=True).start()