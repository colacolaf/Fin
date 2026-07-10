"""OWASP-compliant API key encryption using AES-256-GCM.

Keys derived via PBKDF2HMAC with 600_000 iterations (OWASP 2024 rec).
Each encryption produces a unique 16-byte IV prepended to ciphertext + auth tag.

Storage format: base64( IV[16] || ciphertext || tag[16] )
"""

import base64
import os

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


_ITERATIONS = 600_000  # OWASP 2024 minimum for PBKDF2-HMAC-SHA256
_SALT_PREFIX = b"fin::v1::"  # domain-separated salt prefix


def _derive_key(master_key: str, salt: bytes) -> bytes:
    """Derive 32-byte AES-256 key from master key + salt using PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=_SALT_PREFIX + salt,
        iterations=_ITERATIONS,
    )
    return kdf.derive(master_key.encode("utf-8"))


def encrypt(plaintext: str, master_key: str) -> str:
    """Encrypt a plaintext string with AES-256-GCM.

    Returns base64-encoded blob containing IV + ciphertext + auth tag.
    """
    iv = os.urandom(16)
    salt = os.urandom(16)
    key = _derive_key(master_key, salt)

    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)

    # Pack: salt[16] || iv[16] || ciphertext[tag embedded by AESGCM]
    blob = salt + iv + ciphertext
    return base64.b64encode(blob).decode("ascii")


def decrypt(encoded: str, master_key: str) -> str:
    """Decrypt a base64-encoded blob produced by encrypt().

    Raises cryptography.exceptions.InvalidTag on tampered data.
    """
    blob = base64.b64decode(encoded)

    salt = blob[:16]
    iv = blob[16:32]
    ciphertext = blob[32:]

    key = _derive_key(master_key, salt)
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(iv, ciphertext, None)
    return plaintext.decode("utf-8")