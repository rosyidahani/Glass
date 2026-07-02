#!/usr/bin/env python3
"""
Debug script untuk cek apakah email mahasiswa ada di database
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

email = 'afandiirawan0216@gmail.com'

print("=" * 80)
print(f"🔍 DEBUG: Cari email '{email}'")
print("=" * 80)

# 1. Cek mahasiswa
print("\n1️⃣ CEK MAHASISWA:")
print("-" * 80)
cursor.execute("""
    SELECT id, nim, name, email, active
    FROM mahasiswa_mahasiswa
    WHERE LOWER(email) = LOWER(%s)
""", (email,))
mahasiswa = cursor.fetchone()
if mahasiswa:
    print(f"✅ Mahasiswa ditemukan:")
    print(f"   ID: {mahasiswa[0]}, NIM: {mahasiswa[1]}, Name: {mahasiswa[2]}")
    print(f"   Email: {mahasiswa[3]}, Active: {mahasiswa[4]}")
else:
    print(f"❌ Mahasiswa TIDAK ditemukan dengan email: {email}")

# 2. Cek dosen
print("\n2️⃣ CEK DOSEN:")
print("-" * 80)
cursor.execute("""
    SELECT id, nip, name, email
    FROM feature_dosen
    WHERE LOWER(email) = LOWER(%s)
""", (email,))
dosen = cursor.fetchone()
if dosen:
    print(f"✅ Dosen ditemukan:")
    print(f"   ID: {dosen[0]}, NIP: {dosen[1]}, Name: {dosen[2]}")
    print(f"   Email: {dosen[3]}")
else:
    print(f"❌ Dosen TIDAK ditemukan dengan email: {email}")

# 3. Cek all mahasiswa emails
print("\n3️⃣ SEMUA MAHASISWA EMAILS:")
print("-" * 80)
cursor.execute("""
    SELECT id, nim, name, email, active
    FROM mahasiswa_mahasiswa
    WHERE email IS NOT NULL AND email != ''
    ORDER BY id
""")
all_mhs = cursor.fetchall()
if all_mhs:
    for mhs in all_mhs:
        print(f"ID: {mhs[0]}, NIM: {mhs[1]}, Email: {mhs[3]}, Active: {mhs[4]}")
else:
    print("❌ Tidak ada mahasiswa dengan email")

# 4. Cek struktur mail_mail
print("\n4️⃣ STRUKTUR TABEL mail_mail:")
print("-" * 80)
cursor.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'mail_mail'
    ORDER BY ordinal_position
""")
columns = cursor.fetchall()
for col in columns:
    print(f"   {col[0]}: {col[1]}")

# 5. Cek recent mail records
print("\n5️⃣ RECENT MAIL RECORDS (mail_mail):")
print("-" * 80)
cursor.execute("""
    SELECT id, email_to, state, create_date
    FROM mail_mail
    ORDER BY create_date DESC
    LIMIT 10
""")
mails = cursor.fetchall()
if mails:
    for mail in mails:
        print(f"ID: {mail[0]}, To: {mail[1]}, State: {mail[2]}, Created: {mail[3]}")
else:
    print("ℹ️  Belum ada mail records")

# 6. Test query untuk reset token
print("\n6️⃣ TEST RESET TOKEN QUERY:")
print("-" * 80)
cursor.execute("""
    SELECT * FROM glass_reset_token
    ORDER BY id DESC
    LIMIT 5
""")
tokens = cursor.fetchall()
if tokens:
    print(f"Ada {len(tokens)} reset token:")
    for token in tokens:
        print(f"   {token}")
else:
    print("❌ Tidak ada reset token")

cursor.close()
conn.close()

print("\n" + "=" * 80)
print("📌 KESIMPULAN:")
print("=" * 80)
print("""
Jika mahasiswa/dosen ditemukan TAPI reset token tidak ada:
  → Ada error di OTP generation code (cek Odoo logs)
  
Jika mahasiswa/dosen TIDAK ditemukan:
  → Email mungkin belum di-import atau tidak sesuai
  → Perlu add email ke database manual
""")
