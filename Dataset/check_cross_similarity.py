import psycopg2
import json
import base64
import hashlib
import math
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

def parse_face_vector(vector_text: str):
    s = vector_text.strip()
    if s.startswith('[') and s.endswith(']'):
        s = s[1:-1]
    s = s.replace(' ', ',')
    parts = [p for p in s.split(',') if p != '']
    return [float(p) for p in parts]

def euclidean_distance(vec_a, vec_b) -> float:
    s = 0.0
    for a, b in zip(vec_a, vec_b):
        d = a - b
        s += d * d
    return math.sqrt(s)

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
    
    students = []
    for nim, name, fd in rows:
        plain = aes256_decrypt_b64(fd, 'GlassDevFaceIDSecret_ChangeMe')
        data = json.loads(plain)
        front_vector = data[0]
        students.append({
            'nim': nim,
            'name': name,
            'vector': front_vector
        })
        
    print("--- Pairwise Euclidean Distance Between Different Students ---")
    for i in range(len(students)):
        for j in range(i + 1, len(students)):
            dist = euclidean_distance(students[i]['vector'], students[j]['vector'])
            print(f"{students[i]['name']} vs {students[j]['name']}: {dist:.4f}")
            
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
