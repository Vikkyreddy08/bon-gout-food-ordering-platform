
import os
import json
import logging
import firebase_admin
from firebase_admin import auth, credentials
from django.utils import timezone
from datetime import timedelta
from ..models import OTPAttempt, PhoneOTP

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 5


def initialize_firebase():
    if not firebase_admin._apps:
        creds_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
        if creds_path and os.path.exists(creds_path):
            cred = credentials.Certificate(creds_path)
        else:
            creds_json = os.getenv('FIREBASE_CREDENTIALS_JSON')
            if creds_json:
                cred_dict = json.loads(creds_json)
                cred = credentials.Certificate(cred_dict)
            else:
                raise ValueError("Firebase credentials not set.")
        firebase_admin.initialize_app(cred)


class PhoneOTPService:
    RESEND_COOLDOWN = 60

    @classmethod
    def verify_firebase_token(cls, id_token, phone_number=None):
        try:
            initialize_firebase()
            decoded_token = auth.verify_id_token(id_token)
            verified_phone = decoded_token.get('phone_number')
            if phone_number and verified_phone != phone_number:
                logger.warning(f"Phone mismatch: expected {phone_number}, got {verified_phone}")
                return False, "Phone number mismatch.", None
            return True, "Token verified.", verified_phone
        except Exception as e:
            logger.error(f"Firebase token verification failed: {str(e)}", exc_info=True)
            return False, "Phone verification failed. Please check the code and try again.", None

    @classmethod
    def check_resend_cooldown(cls, phone):
        try:
            attempt, _ = OTPAttempt.objects.get_or_create(
                identifier=phone,
                attempt_type='phone'
            )
            if attempt.is_in_cooldown():
                remaining = (attempt.cooldown_until - timezone.now()).total_seconds()
                return False, f"Please wait {int(remaining)} seconds."
            attempt.cooldown_until = timezone.now() + timedelta(seconds=cls.RESEND_COOLDOWN)
            attempt.save()
            # Also create/update PhoneOTP entry with expiry. Preserve attempts counter
            # if the previous OTP is still active (unexpired & unverified), otherwise reset.
            now = timezone.now()
            existing = PhoneOTP.objects.filter(phone=phone).first()
            reset_attempts = True
            if existing and not existing.is_verified and not existing.is_expired():
                reset_attempts = False
            PhoneOTP.objects.update_or_create(
                phone=phone,
                defaults={
                    'expires_at': now + timedelta(minutes=5),
                    'is_verified': False,
                    'attempts': 0 if reset_attempts else (existing.attempts if existing else 0),
                }
            )
            return True, "Cooldown passed."
        except Exception as e:
            logger.error(f"check_resend_cooldown DB error for phone: {str(e)}", exc_info=True)
            raise

    @classmethod
    def _verify_and_consume_phone_otp(cls, verified_phone):
        """Internal shared method: checks PhoneOTP existence, expiry, replay, and attempts.
        Marks as verified on success, increments attempts on failure.
        Returns (success: bool, message: str)."""
        try:
            otp_obj = PhoneOTP.objects.get(phone=verified_phone)
        except PhoneOTP.DoesNotExist:
            logger.warning(f"PhoneOTP record missing for {verified_phone}")
            return False, "No phone OTP request was initiated. Please request a new code."
        if otp_obj.is_verified:
            logger.warning(f"Replay attempt: PhoneOTP already used for {verified_phone}")
            return False, "This OTP has already been used. Please request a new code."
        if otp_obj.is_expired():
            return False, "This OTP has expired. Please request a new code."
        attempts = getattr(otp_obj, 'attempts', 0) or 0
        if attempts >= MAX_ATTEMPTS:
            return False, f"Too many attempts. Please request a new code."
        return True, otp_obj

    @classmethod
    def verify_otp_for_login(cls, id_token, phone=None):
        """Verifies Firebase token AND validates PhoneOTP record (existence/expiry/replay)."""
        success, message, verified_phone = cls.verify_firebase_token(id_token, phone)
        if not success:
            return False, message, None
        result = cls._verify_and_consume_phone_otp(verified_phone)
        if not result[0]:
            return False, result[1], None
        otp_obj = result[1]
        otp_obj.is_verified = True
        otp_obj.save()
        return True, "Phone OTP verified and login successful", verified_phone

    @classmethod
    def verify_otp_for_signup(cls, id_token, phone):
        """Verify Firebase token and mark PhoneOTP as verified (no login)."""
        success, message, verified_phone = cls.verify_firebase_token(id_token, phone)
        if not success:
            return False, message
        result = cls._verify_and_consume_phone_otp(verified_phone)
        if not result[0]:
            return False, result[1]
        otp_obj = result[1]
        otp_obj.is_verified = True
        otp_obj.save()
        return True, "Phone OTP verified successfully for signup."
