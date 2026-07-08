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
                               method: str = 'euclidean', threshold: float = 0.45) -> dict:
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

    # Parse stored descriptors (supports single vector or JSON list of vectors)
    stored_vectors = []
    try:
        data = json.loads(stored_plain)
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
            stored_vectors = data
        else:
            stored_vectors = [parse_face_vector(stored_plain)]
    except Exception:
        stored_vectors = [parse_face_vector(stored_plain)]

    # Parse client descriptors (supports single vector or JSON list of vectors)
    client_vectors = []
    try:
        c_data = json.loads(client_descriptor)
        if isinstance(c_data, list) and len(c_data) > 0 and isinstance(c_data[0], list):
            client_vectors = c_data
        else:
            client_vectors = [parse_face_vector(client_descriptor)]
    except Exception:
        client_vectors = [parse_face_vector(client_descriptor)]

    if not stored_vectors or any(not sv for sv in stored_vectors) or not client_vectors or any(not cv for cv in client_vectors):
        raise UserError('Face descriptor tidak valid atau kosong.')

    if len(stored_vectors) == 3 and len(client_vectors) == 3:
        # Pairwise comparison: Front-Front, Left-Left, Right-Right
        if method == 'cosine':
            scores = [cosine_similarity(sv, cv) for sv, cv in zip(stored_vectors, client_vectors)]
            score = sum(scores) / 3.0
            # Setiap sudut harus mirip (toleransi margin 0.08) dan rata-ratanya harus memenuhi threshold
            ok = all(s >= (float(threshold) - 0.08) for s in scores) and score >= float(threshold)
        elif method == 'euclidean':
            dists = [euclidean_distance(sv, cv) for sv, cv in zip(stored_vectors, client_vectors)]
            score = sum(dists) / 3.0
            ok = all(d <= (float(threshold) + 0.08) for d in dists) and score <= float(threshold)
    else:
        # Cross comparison (any stored vs any client)
        if method == 'cosine':
            scores = [cosine_similarity(sv, cv) for sv in stored_vectors for cv in client_vectors]
            score = max(scores) if scores else 0.0
            ok = score >= float(threshold)
        elif method == 'euclidean':
            dists = [euclidean_distance(sv, cv) for sv in stored_vectors for cv in client_vectors]
            score = min(dists) if dists else float('inf')
            ok = score <= float(threshold)

    return {'ok': bool(ok), 'score': float(score)}

