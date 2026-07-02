#!/usr/bin/env python3
"""
Debug script untuk cek status OTP dan email yang dikirim
"""
import psycopg2
from datetime import datetime

# Database connection
conn = psycopg2.connect(
    host='localhost',
    port=5432,
    database='MercandiseTI',
    user='odoo',
    password='odoopwd'
)
cursor = conn.cursor()

print("=" * 80)
print("🔍 DEBUG: OTP & EMAIL STATUS")
print("=" * 80)

# 1. Cek reset token terbaru
print("\n1️⃣ RESET TOKEN TERBARU (glass_reset_token):")
print("-" * 80)
cursor.execute("""
    SELECT id, email, role, user_ref_id, token, expired_at, used, create_date
    FROM glass_reset_token
    ORDER BY create_date DESC
    LIMIT 5
""")
tokens = cursor.fetchall()
if tokens:
    for token in tokens:
        print(f"ID: {token[0]}, Email: {token[1]}, Role: {token[2]}, OTP: {token[4]}")
        print(f"  Created: {token[7]}, Expired: {token[5]}, Used: {token[6]}")
else:
    print("❌ TIDAK ADA RESET TOKEN - Email mungkin tidak diproses!")

# 2. Cek mail records terbaru
print("\n2️⃣ EMAIL YANG DIKIRIM (mail_mail):")
print("-" * 80)
cursor.execute("""
    SELECT id, subject, email_to, state, create_date
    FROM mail_mail
    WHERE email_to LIKE '%afandiirawan%'
    ORDER BY create_date DESC
    LIMIT 10
""")
mails = cursor.fetchall()
if mails:
    for mail in mails:
        print(f"ID: {mail[0]}, To: {mail[2]}, State: {mail[3]}")
        print(f"  Subject: {mail[1]}")
        print(f"  Created: {mail[4]}")
else:
    print("❌ TIDAK ADA EMAIL RECORD - OTP belum digenerate!")

# 3. Cek semua mail status
print("\n3️⃣ STATUS SEMUA EMAIL (mail_mail):")
print("-" * 80)
cursor.execute("""
    SELECT state, COUNT(*) as total
    FROM mail_mail
    GROUP BY state
    ORDER BY total DESC
""")
status_counts = cursor.fetchall()
for status in status_counts:
    print(f"  {status[0]}: {status[1]} email")

# 4. Cek outgoing mail server
print("\n4️⃣ OUTGOING MAIL SERVER (ir_mail_server):")
print("-" * 80)
cursor.execute("""
    SELECT id, name, smtp_host, smtp_port, smtp_user, smtp_encryption, active
    FROM ir_mail_server
    LIMIT 5
""")
servers = cursor.fetchall()
if servers:
    for server in servers:
        print(f"Server: {server[1]}")
        print(f"  Host: {server[2]}, Port: {server[3]}, User: {server[4]}")
        print(f"  Encryption: {server[5]}, Active: {server[6]}")
else:
    print("❌ TIDAK ADA OUTGOING MAIL SERVER - Email tidak bisa dikirim!")

# 5. Cek mahasiswa dengan email tersebut
print("\n5️⃣ MAHASISWA DATA:")
print("-" * 80)
cursor.execute("""
    SELECT id, nim, name, email, password
    FROM mahasiswa_mahasiswa
    WHERE email LIKE '%afandiirawan%'
    LIMIT 5
""")
mahasiswa_list = cursor.fetchall()
if mahasiswa_list:
    for mhs in mahasiswa_list:
        print(f"ID: {mhs[0]}, NIM: {mhs[1]}, Name: {mhs[2]}")
        print(f"  Email: {mhs[3]}")
else:
    print("❌ TIDAK ADA MAHASISWA DENGAN EMAIL TERSEBUT!")

# 6. Cek recent logs
print("\n6️⃣ RECENT LOG RECORDS (ir_logging):")
print("-" * 80)
cursor.execute("""
    SELECT id, name, level, message, create_date
    FROM ir_logging
    WHERE name LIKE '%mail%' OR name LIKE '%otp%' OR name LIKE '%password%'
    ORDER BY create_date DESC
    LIMIT 10
""")
logs = cursor.fetchall()
if logs:
    for log in logs:
        print(f"[{log[2]}] {log[1]}: {log[3][:80]}")
else:
    print("ℹ️  Tidak ada log terkait mail/otp/password")

print("\n" + "=" * 80)
print("📋 RINGKASAN DEBUGGING:")
print("=" * 80)
print("""
Jika:
✅ Reset token ada → OTP sudah generate (cek step 2)
✅ Mail records ada dengan state 'sent' → Email sudah terkirim
❌ Mail records ada dengan state 'outgoing' → Email stuck (cek outgoing server)
❌ Tidak ada mail records → Odoo tidak create email (cek logs di Odoo)
❌ Tidak ada outgoing server → Configure outgoing mail server di Odoo settings
""")

cursor.close()
conn.close()
