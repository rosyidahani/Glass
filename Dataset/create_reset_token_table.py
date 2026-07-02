#!/usr/bin/env python3
"""
Buat tabel glass_reset_token di PostgreSQL jika belum ada
"""
import psycopg2

conn = psycopg2.connect(
    host='localhost',
    port=5432,
    database='MercandiseTI',
    user='odoo',
    password='odoopwd'
)
cursor = conn.cursor()

print("🔧 Membuat tabel glass_reset_token...")

# Buat tabel jika belum ada
sql = """
CREATE TABLE IF NOT EXISTS glass_reset_token (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    user_ref_id INTEGER NOT NULL,
    token VARCHAR NOT NULL,
    expired_at TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    create_uid INTEGER,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    write_uid INTEGER,
    write_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS glass_reset_token_email_idx ON glass_reset_token(email);
CREATE INDEX IF NOT EXISTS glass_reset_token_token_idx ON glass_reset_token(token);
"""

cursor.execute(sql)
conn.commit()

print("✅ Tabel glass_reset_token berhasil dibuat!")

# Check if table exists
cursor.execute("""
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'glass_reset_token'
    );
""")
table_exists = cursor.fetchone()[0]
print(f"✅ Tabel ada: {table_exists}")

# Check modul state
print("\n🔍 Status modul di Odoo:")
cursor.execute("""
    SELECT name, state FROM ir_module_module 
    WHERE name IN ('custom_web', 'mahasiswa', 'feature_dosen')
    ORDER BY name
""")
modules = cursor.fetchall()
for mod in modules:
    print(f"  {mod[0]}: {mod[1]}")

# Set ke uninstalled agar re-install
print("\n🔄 Reset modul state untuk force upgrade...")
cursor.execute("""
    UPDATE ir_module_module 
    SET state = 'to upgrade' 
    WHERE name IN ('custom_web', 'mahasiswa', 'feature_dosen')
""")
conn.commit()
print("✅ Modul di-set ke 'to upgrade'")

cursor.close()
conn.close()

print("\n📌 SEKARANG: Restart Odoo agar modul di-upgrade dan OTP bisa berfungsi!")
