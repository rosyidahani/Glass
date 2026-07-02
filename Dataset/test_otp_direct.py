#!/usr/bin/env python3
"""
Test OTP generation logic secara langsung
"""
import sys
import os
sys.path.insert(0, 'd:\\Glass')

import psycopg2
from datetime import datetime, timedelta
import random

# Test database connection
try:
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        database='MercandiseTI',
        user='odoo',
        password='odoopwd'
    )
    cursor = conn.cursor()
    print("✅ Database connection OK")
except Exception as e:
    print(f"❌ Database error: {e}")
    sys.exit(1)

email = 'afandiirawan0216@gmail.com'

print("=" * 80)
print(f"🔧 TEST: OTP Generation untuk email '{email}'")
print("=" * 80)

try:
    # 1. Cari mahasiswa
    print("\n1️⃣ Cari mahasiswa dengan email...")
    cursor.execute("""
        SELECT id, nim, name FROM mahasiswa_mahasiswa
        WHERE LOWER(email) = LOWER(%s) AND active = TRUE
    """, (email,))
    mahasiswa = cursor.fetchone()
    
    if mahasiswa:
        print(f"✅ Mahasiswa ditemukan: ID={mahasiswa[0]}, NIM={mahasiswa[1]}, Name={mahasiswa[2]}")
        mhs_id = mahasiswa[0]
        role = 'mahasiswa'
    else:
        print(f"❌ Mahasiswa tidak ditemukan")
        sys.exit(1)
    
    # 2. Generate OTP
    print("\n2️⃣ Generate OTP 6 digit...")
    otp_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    print(f"✅ OTP generated: {otp_code}")
    
    # 3. Calculate expiry
    print("\n3️⃣ Calculate expiry (15 menit)...")
    expired_at = datetime.now() + timedelta(minutes=15)
    print(f"✅ Expired at: {expired_at}")
    
    # 4. Hapus OTP lama
    print("\n4️⃣ Hapus OTP lama untuk email ini...")
    cursor.execute("""
        DELETE FROM glass_reset_token
        WHERE LOWER(email) = LOWER(%s) AND used = FALSE
    """, (email,))
    deleted_count = cursor.rowcount
    print(f"✅ Deleted {deleted_count} old tokens")
    
    # 5. Create reset token
    print("\n5️⃣ Create reset token di database...")
    cursor.execute("""
        INSERT INTO glass_reset_token (email, role, user_ref_id, token, expired_at, used, create_date)
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
        RETURNING id
    """, (email, role, mhs_id, otp_code, expired_at, False))
    
    token_id = cursor.fetchone()[0]
    conn.commit()
    print(f"✅ Reset token created with ID: {token_id}")
    
    # 6. Verify
    print("\n6️⃣ Verify token tersimpan...")
    cursor.execute("""
        SELECT id, email, role, user_ref_id, token, expired_at, used
        FROM glass_reset_token
        WHERE id = %s
    """, (token_id,))
    token = cursor.fetchone()
    if token:
        print(f"✅ Token found in DB: {token}")
    else:
        print(f"❌ Token NOT found after insert!")
    
    print("\n" + "=" * 80)
    print("✅ OTP GENERATION TEST PASSED!")
    print("=" * 80)
    print(f"""
OTP CODE: {otp_code}
Kirim via email ke: {email}
""")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    cursor.close()
    conn.close()
