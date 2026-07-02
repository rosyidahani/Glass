#!/usr/bin/env python3
"""Check OTP token in database"""
import psycopg2

conn = psycopg2.connect(
    host='localhost',
    port=5432,
    database='MercandiseTI',
    user='odoo',
    password='odoopwd'
)
cursor = conn.cursor()

print("=== RESET TOKEN STATUS ===")
cursor.execute("""
    SELECT id, email, role, token, expired_at, used, create_date
    FROM glass_reset_token
    ORDER BY create_date DESC
    LIMIT 5
""")
tokens = cursor.fetchall()
if tokens:
    for t in tokens:
        print(f"ID:{t[0]} Email:{t[1]} Token:{t[3]} Used:{t[5]}")
else:
    print("NO TOKENS FOUND!")

print("\n=== RECENT MAIL RECORDS ===")
cursor.execute("""
    SELECT id, email_to, state, create_date
    FROM mail_mail
    ORDER BY create_date DESC
    LIMIT 5
""")
mails = cursor.fetchall()
if mails:
    for m in mails:
        print(f"ID:{m[0]} To:{m[1][:40]} State:{m[2]}")
else:
    print("NO MAIL RECORDS")

cursor.close()
conn.close()
