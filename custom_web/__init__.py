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
    _logger.info("[EMAIL_UPDATER] Starting automatic database email and SMTP server config thread...")
    
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
        
    # Resolve CSV paths relative to this addon
    import csv
    base_dir = os.path.dirname(os.path.dirname(__file__))
    mhs_csv = os.path.join(base_dir, 'Dataset', 'Data Mahasiswa (mahasiswa.mahasiswa) (1) - Sheet1.csv')
    dosen_csv = os.path.join(base_dir, 'Dataset', 'Data Dosen (feature.dosen) - Sheet1.csv')
    
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
            
            # A. Update/Add outgoing mail server
            try:
                # Check if ir_mail_server table exists
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM pg_tables 
                        WHERE tablename = 'ir_mail_server'
                    );
                """)
                if cursor.fetchone()[0]:
                    # Check if 'Gmail OTP' or host 'smtp.gmail.com' already exists
                    cursor.execute("SELECT id FROM ir_mail_server WHERE name = 'Gmail OTP' OR smtp_host = 'smtp.gmail.com';")
                    if not cursor.fetchone():
                        _logger.info(f"[EMAIL_UPDATER] Configured SMTP server is missing in '{db_name}'. Inserting Gmail SMTP...")
                        cursor.execute("""
                            INSERT INTO ir_mail_server (
                                smtp_port, sequence, create_uid, write_uid, name, 
                                smtp_host, smtp_authentication, smtp_user, smtp_pass, 
                                smtp_encryption, smtp_debug, active, create_date, write_date
                            ) VALUES (
                                587, 10, 1, 1, 'Gmail OTP', 
                                'smtp.gmail.com', 'login', 'afandiirawan0216@gmail.com', 'zxiwodzdujjrmczz', 
                                'starttls', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                            )
                        """)
                        conn.commit()
            except Exception as smtp_ex:
                _logger.error(f"[EMAIL_UPDATER] SMTP config failed in '{db_name}': {smtp_ex}")
                conn.rollback()

            # B. Update Mahasiswa emails from CSV
            try:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM pg_tables 
                        WHERE tablename = 'mahasiswa_mahasiswa'
                    );
                """)
                if cursor.fetchone()[0] and os.path.exists(mhs_csv):
                    # Check if email column exists, create if missing
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
                        
                    _logger.info(f"[EMAIL_UPDATER] Updating student emails from CSV: {mhs_csv}")
                    with open(mhs_csv, mode='r', encoding='utf-8') as f:
                        reader = csv.reader(f)
                        header = next(reader)
                        
                        try:
                            nim_idx = header.index('NIM')
                            email_idx = header.index('Email')
                        except ValueError:
                            nim_idx = 1
                            email_idx = len(header) - 1
                            
                        updated_count = 0
                        for row in reader:
                            if len(row) > max(nim_idx, email_idx):
                                nim_val = row[nim_idx].strip()
                                email_val = row[email_idx].strip().lower()
                                if nim_val and email_val:
                                    cursor.execute("UPDATE mahasiswa_mahasiswa SET email = %s WHERE nim = %s;", (email_val, nim_val))
                                    updated_count += cursor.rowcount
                        conn.commit()
                        _logger.info(f"[EMAIL_UPDATER] Updated {updated_count} student emails in '{db_name}'")
            except Exception as mhs_ex:
                _logger.error(f"[EMAIL_UPDATER] Student email update failed in '{db_name}': {mhs_ex}")
                conn.rollback()

            # C. Update Dosen emails from CSV
            try:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM pg_tables 
                        WHERE tablename = 'feature_dosen'
                    );
                """)
                if cursor.fetchone()[0] and os.path.exists(dosen_csv):
                    # Check if email column exists
                    cursor.execute("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.columns 
                            WHERE table_name = 'feature_dosen' 
                            AND column_name = 'email'
                        );
                    """)
                    if not cursor.fetchone()[0]:
                        cursor.execute("ALTER TABLE feature_dosen ADD COLUMN email VARCHAR(255);")
                        conn.commit()
                        
                    _logger.info(f"[EMAIL_UPDATER] Updating lecturer emails from CSV: {dosen_csv}")
                    with open(dosen_csv, mode='r', encoding='utf-8') as f:
                        reader = csv.reader(f)
                        header = next(reader)
                        
                        try:
                            nip_idx = header.index('NIP')
                            email_idx = header.index('Email')
                        except ValueError:
                            nip_idx = 1
                            email_idx = len(header) - 1
                            
                        updated_count = 0
                        for row in reader:
                            if len(row) > max(nip_idx, email_idx):
                                nip_val = row[nip_idx].strip()
                                email_val = row[email_idx].strip().lower()
                                if nip_val and email_val:
                                    cursor.execute("UPDATE feature_dosen SET email = %s WHERE nip = %s;", (email_val, nip_val))
                                    updated_count += cursor.rowcount
                        conn.commit()
                        _logger.info(f"[EMAIL_UPDATER] Updated {updated_count} lecturer emails in '{db_name}'")
            except Exception as dosen_ex:
                _logger.error(f"[EMAIL_UPDATER] Lecturer email update failed in '{db_name}': {dosen_ex}")
                conn.rollback()

            cursor.close()
            conn.close()
        except Exception as ex:
            _logger.warning(f"[EMAIL_UPDATER] Failed database '{db_name}' or database does not exist: {ex}")

# Start the background thread on import
threading.Thread(target=_auto_update_email, daemon=True).start()