import psycopg2
import json
import base64
import hashlib
import hmac
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
    cur.execute("SELECT name, face_descriptor FROM mahasiswa_mahasiswa WHERE nim = '2411501035';")
    row = cur.fetchone()
    if not row:
        print("Mahasiswa not found.")
        return
    name, fd = row
    print("Name:", name)
    if not fd:
        print("face_descriptor is NULL or empty.")
        return
    try:
        plain = aes256_decrypt_b64(fd, 'GlassDevFaceIDSecret_ChangeMe')
        print("Plaintext prefix:", plain[:100])
        data = json.loads(plain)
        print("Data type:", type(data))
        if isinstance(data, list):
            print("Length of list:", len(data))
            if len(data) > 0:
                print("Type of first element:", type(data[0]))
                if isinstance(data[0], list):
                    print("Length of first element:", len(data[0]))
                else:
                    print("First element:", data[0])
    except Exception as e:
        print("Error decrypting/parsing:", e)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
