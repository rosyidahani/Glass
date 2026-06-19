import base64
import json
import math

from odoo.exceptions import UserError

from .faceid_utils import (
    aes256_decrypt_b64,
    parse_face_vector,
    cosine_similarity,
    euclidean_distance,
)


def _get_faceid_secret(env):
    """Read FaceID AES secret from system parameter if available."""
    icp = env['ir.config_parameter'].sudo()
    secret = icp.get_param('glass.faceid.aes_secret', default='')
    if not secret:
        # Fallback to hardcoded value for dev. In production, set system parameter.
        secret = 'GlassDevFaceIDSecret_ChangeMe'
    return secret


def verify_face_server_side(env, stored_encrypted_descriptor_b64: str, client_descriptor: str,
                               method: str = 'cosine', threshold: float = 0.82) -> dict:
    """Verify if client face_descriptor matches stored descriptor.

    Parameters
    - stored_encrypted_descriptor_b64: value stored in mahasiswa.face_descriptor (AES encrypted, base64).
    - client_descriptor: raw vector text from client.
    - method: 'cosine' or 'euclidean'
    - threshold:
        - cosine: accept if similarity >= threshold
        - euclidean: accept if distance <= threshold

    Returns dict: { ok: bool, score: float }
    """
    secret = _get_faceid_secret(env)

    if not stored_encrypted_descriptor_b64:
        raise UserError('FaceID database descriptor belum tersedia untuk mahasiswa ini.')

    if not client_descriptor:
        raise UserError('Face descriptor dari client tidak tersedia.')

    stored_plain = aes256_decrypt_b64(stored_encrypted_descriptor_b64, secret)

    # Parse to vectors
    stored_vec = parse_face_vector(stored_plain)
    client_vec = parse_face_vector(client_descriptor)

    if not stored_vec or not client_vec:
        raise UserError('Face descriptor tidak valid atau kosong.')

    if method == 'cosine':
        score = cosine_similarity(stored_vec, client_vec)
        ok = score >= float(threshold)
    elif method == 'euclidean':
        dist = euclidean_distance(stored_vec, client_vec)
        score = dist
        ok = dist <= float(threshold)
    else:
        raise UserError('Metode FaceID tidak dikenal.')

    return {'ok': bool(ok), 'score': float(score)}

