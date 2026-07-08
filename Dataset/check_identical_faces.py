import psycopg2
import json
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend

def derive_aes256_key(secret: str) -> bytes:
    material = b'glass.faceid.aes256.salt.v1' + secret.encode('utf-8')
    return hashlib.sha256(material).digest()

def _pkcs7_unpad(data: bytes, block_size: int = 16) -> bytes:
    unpadder = padding.PKCS7(block_size * 8).unpadder()
    return unpadder.update(data) + unpadder.finalize()

def aes256_decrypt_b64(ciphertext_b64: str, secret: str) -> str:
    raw = base64.b64decode(ciphertext_b64.encode('utf-8'))
    iv = raw[:16]
    ct = raw[16:]
    key = derive_aes256_key(secret)
    backend = default_backend()
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=backend)
    decryptor = cipher.decryptor()
    padded = decryptor.update(ct) + decryptor.finalize()
    pt = _pkcs7_unpad(padded)
    return pt.decode('utf-8')

def main():
    conn = psycopg2.connect(
        host='localhost',
        user='openpg',
        password='koentji',
        port=5432,
        database='Glass'
    )
    cur = conn.cursor()
    cur.execute("SELECT nim, name, face_descriptor FROM mahasiswa_mahasiswa WHERE face_descriptor IS NOT NULL;")
    rows = cur.fetchall()
    print(f"Total students with face descriptors: {len(rows)}")
    descriptors_map = {}
    for nim, name, fd in rows:
        try:
            plain = aes256_decrypt_b64(fd, 'GlassDevFaceIDSecret_ChangeMe')
            h = hashlib.sha256(plain.encode('utf-8')).hexdigest()
            if h not in descriptors_map:
                descriptors_map[h] = []
            descriptors_map[h].append((nim, name))
        except Exception as e:
            print(f"Error decrypting for {nim}: {e}")
            
    print("\n--- Grouped by identical face descriptors ---")
    for h, members in descriptors_map.items():
        print(f"Hash: {h[:10]}... (Count: {len(members)})")
        for m in members[:5]:
            print(f"  NIM: {m[0]}, Name: {m[1]}")
        if len(members) > 5:
            print("  ...")
            
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
