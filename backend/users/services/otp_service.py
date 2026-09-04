
import secrets
import hashlib
import hmac
from django.utils import timezone
from datetime import timedelta


_DIGITS = "0123456789"


def generate_otp(length=6):
    """Cryptographically-secure 6-digit OTP using the standard `secrets` module."""
    return ''.join(secrets.choice(_DIGITS) for _ in range(length))


def hash_otp(otp):
    """Salted SHA-256 hash using Django's per-installation SECRET_KEY as pepper.

    NOTE: Django `make_password` (PBKDF2) is preferred for long-lived secrets;
    SHA-256 with a global pepper is acceptable here because 6-digit OTPs are
    short-lived and also rate-limited. This at least prevents a simple
    rainbow-table attack across deployments.
    """
    from django.conf import settings
    pepper = (settings.SECRET_KEY or "").encode()
    digest = hashlib.sha256(pepper + otp.encode()).hexdigest()
    return digest


def verify_otp(otp, otp_hash):
    """Constant-time OTP comparison using hmac.compare_digest to prevent timing attacks."""
    return hmac.compare_digest(hash_otp(otp), otp_hash)


def get_expiry_time(minutes=5):
    return timezone.now() + timedelta(minutes=minutes)
