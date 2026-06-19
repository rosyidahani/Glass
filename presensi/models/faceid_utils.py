import base64
import binascii
import hashlib
import hmac
import math

from odoo.exceptions import UserError

try:
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
    from cryptography.hazmat.backends import default_backend
except Exception:  # pragma: no cover
    Cipher = None


# NOTE:
# - Odoo typically runs on a server where `cryptography` may not be installed.
# - This helper degrades gracefully by raising explicit errors.


DEFAULT_AES_KEY_DERIVATION_SALT = b'glass.faceid.aes256.salt.v1'


def _require_crypto():
    if Cipher is None:
        raise UserError(
            'Module dependency "cryptography" belum tersedia. '
            'Install library cryptography untuk FaceID AES-256.'
        )


def derive_aes256_key(secret: str) -> bytes:
    """Derive deterministic 32-byte key from secret using SHA-256.

    This is not the same as a KDF like PBKDF2, but is enough for a simple local key derivation.
    """
    if secret is None:
        secret = ''
    material = DEFAULT_AES_KEY_DERIVATION_SALT + secret.encode('utf-8')
    return hashlib.sha256(material).digest()


def _pkcs7_pad(data: bytes, block_size: int = 16) -> bytes:
    padder = padding.PKCS7(block_size * 8).padder()
    return padder.update(data) + padder.finalize()


def _pkcs7_unpad(data: bytes, block_size: int = 16) -> bytes:
    unpadder = padding.PKCS7(block_size * 8).unpadder()
    return unpadder.update(data) + unpadder.finalize()


def aes256_encrypt_b64(plaintext: str, secret: str) -> str:
    """Encrypt plaintext string with AES-256-CBC and return base64 ciphertext.

    Output format: base64( iv(16) + ciphertext )
    """
    _require_crypto()
    if plaintext is None:
        plaintext = ''

    key = derive_aes256_key(secret)

    backend = default_backend()

    # Generate IV deterministically from random is better, but we keep it simple:
    # Use HMAC-based IV so it is unique per message.
    iv = hmac.new(key, plaintext.encode('utf-8'), hashlib.sha256).digest()[:16]

    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=backend)
    encryptor = cipher.encryptor()

    padded = _pkcs7_pad(plaintext.encode('utf-8'))
    ct = encryptor.update(padded) + encryptor.finalize()

    return base64.b64encode(iv + ct).decode('utf-8')


def aes256_decrypt_b64(ciphertext_b64: str, secret: str) -> str:
    """Decrypt base64 ciphertext produced by aes256_encrypt_b64."""
    _require_crypto()
    if not ciphertext_b64:
        return ''

    raw = base64.b64decode(ciphertext_b64.encode('utf-8'))
    if len(raw) < 16:
        raise UserError('Ciphertext FaceDescriptor invalid.')

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
    """Parse stored face vector.

    Supported formats:
    - JSON-like list: "[0.1,0.2,...]"
    - Comma-separated: "0.1,0.2,..."
    - Whitespace-separated: "0.1 0.2 ..."
    """
    if vector_text is None:
        return []

    s = vector_text.strip()
    if not s:
        return []

    # Strip brackets if present
    if s.startswith('[') and s.endswith(']'):
        s = s[1:-1]

    # Normalize separators to comma
    s = s.replace(' ', ',')
    parts = [p for p in s.split(',') if p != '']

    vec = []
    for p in parts:
        vec.append(float(p))
    return vec


def cosine_similarity(vec_a, vec_b) -> float:
    if not vec_a or not vec_b:
        return 0.0
    if len(vec_a) != len(vec_b):
        raise UserError('Face vector dimension mismatch.')

    dot = 0.0
    norm_a = 0.0
    norm_b = 0.0
    for a, b in zip(vec_a, vec_b):
        dot += a * b
        norm_a += a * a
        norm_b += b * b

    if norm_a <= 0 or norm_b <= 0:
        return 0.0

    return dot / (math.sqrt(norm_a) * math.sqrt(norm_b))


def euclidean_distance(vec_a, vec_b) -> float:
    if not vec_a or not vec_b:
        return float('inf')
    if len(vec_a) != len(vec_b):
        raise UserError('Face vector dimension mismatch.')

    s = 0.0
    for a, b in zip(vec_a, vec_b):
        d = a - b
        s += d * d
    return math.sqrt(s)


def constant_time_compare(a: str, b: str) -> bool:
    """Constant-time compare for strings."""
    return hmac.compare_digest(a.encode('utf-8'), b.encode('utf-8'))

