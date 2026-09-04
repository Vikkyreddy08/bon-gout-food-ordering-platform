
import logging
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from django.core.mail import send_mail
from django.conf import settings
from .otp_service import generate_otp, hash_otp, get_expiry_time, verify_otp as verify_hash
from ..models import EmailOTP, OTPAttempt
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


def send_otp_email(subject, message, recipient, from_email):
    """Send OTP through HTTPS in production, avoiding Render SMTP timeouts."""
    if settings.EMAIL_PROVIDER != 'resend':
        return send_mail(subject, message, from_email, [recipient], fail_silently=False)

    if not settings.RESEND_API_KEY or not settings.RESEND_FROM_EMAIL:
        raise RuntimeError('EMAIL_PROVIDER=resend requires RESEND_API_KEY and RESEND_FROM_EMAIL')

    payload = json.dumps({
        'from': settings.RESEND_FROM_EMAIL,
        'to': [recipient],
        'subject': subject,
        'text': message,
    }).encode('utf-8')
    request = Request(
        'https://api.resend.com/emails',
        data=payload,
        headers={
            'Authorization': f'Bearer {settings.RESEND_API_KEY}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        with urlopen(request, timeout=15) as response:
            if response.status not in range(200, 300):
                raise RuntimeError(f'Resend returned HTTP {response.status}')
    except HTTPError as exc:
        error_body = exc.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'Resend rejected email ({exc.code}): {error_body}') from exc
    except URLError as exc:
        raise RuntimeError(f'Resend connection failed: {exc.reason}') from exc
    return 1


class EmailOTPService:
    MAX_ATTEMPTS = 5
    RESEND_COOLDOWN = 60

    @classmethod
    def send_otp(cls, email, include_test_otp=False):
        try:
            attempt, _ = OTPAttempt.objects.get_or_create(
                identifier=email,
                attempt_type='email'
            )
        except Exception as e:
            logger.error(f"send_otp DB error (attempt get_or_create): {str(e)}", exc_info=True)
            raise
        if attempt.is_in_cooldown():
            remaining_seconds = (attempt.cooldown_until - timezone.now()).total_seconds()
            return False, f"Please wait {int(remaining_seconds)} seconds before resending."
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        expires_at = get_expiry_time()
        now = timezone.now()

        try:
            existing = EmailOTP.objects.filter(email=email).first()
        except Exception as e:
            logger.error(f"send_otp DB error (filter existing): {str(e)}", exc_info=True)
            raise
        reset_attempts = True
        if existing and not existing.is_verified and not existing.is_expired():
            reset_attempts = False

        try:
            EmailOTP.objects.update_or_create(
                email=email,
                defaults={
                    'otp_hash': otp_hash,
                    'expires_at': expires_at,
                    'is_verified': False,
                    'attempts': 0 if reset_attempts else (existing.attempts if existing else 0),
                }
            )
        except Exception as e:
            logger.error(f"send_otp DB error (update_or_create): {str(e)}", exc_info=True)
            raise
        try:
            subject = "Your OTP for Bon Goût"
            message = f"Your OTP is: {otp}\nValid for 5 minutes."
            from_email = settings.DEFAULT_FROM_EMAIL
            if settings.EMAIL_OTP_TEST_MODE:
                logger.warning("EMAIL_OTP_TEST_MODE is enabled; OTP email delivery is skipped")
            else:
                send_otp_email(subject, message, email, from_email)
            attempt.attempts = 0
            attempt.cooldown_until = now + timedelta(seconds=cls.RESEND_COOLDOWN)
            attempt.save()
            if include_test_otp and settings.EMAIL_OTP_TEST_MODE:
                logger.warning(f"Test OTP generated for {email[:4]}*** (masked); email not sent")
                return True, "OTP generated successfully (TEST MODE).", otp
            logger.info(f"Email OTP sent to {email[:4]}*** (masked)")
            return True, "OTP sent successfully."
        except Exception as e:
            logger.error(f"Failed to send Email OTP to {email[:4]}***: {str(e)}", exc_info=True)
            return False, "Failed to send OTP. Please try again later."

    @classmethod
    def _verify_email_otp_record(cls, email, otp):
        """Internal shared method: checks EmailOTP existence, expiry, replay, attempts.
        Marks as verified on success, increments attempts on failure.
        Returns (success: bool, message: str, otp_obj | None)."""
        try:
            otp_obj = EmailOTP.objects.get(email=email)
        except EmailOTP.DoesNotExist:
            logger.warning(f"EmailOTP missing for verify: {email[:4]}***")
            return False, "No OTP was requested for this email. Please request a new one.", None
        except Exception as e:
            logger.error(f"_verify_email_otp_record DB error (get): {str(e)}", exc_info=True)
            raise
        if otp_obj.is_verified:
            logger.warning(f"Replay attempt: EmailOTP already used for {email[:4]}***")
            return False, "This OTP has already been used. Please request a new code.", None
        if otp_obj.is_expired():
            return False, "This OTP has expired. Please request a new code.", None
        if otp_obj.attempts >= cls.MAX_ATTEMPTS:
            return False, f"Too many incorrect attempts. Please request a new code.", None
        if verify_hash(otp, otp_obj.otp_hash):
            return True, "OTP valid.", otp_obj
        try:
            otp_obj.attempts += 1
            otp_obj.save()
        except Exception as e:
            logger.error(f"_verify_email_otp_record DB error (save attempts): {str(e)}", exc_info=True)
            raise
        attempts_left = max(cls.MAX_ATTEMPTS - otp_obj.attempts, 0)
        msg = f"Invalid OTP. {attempts_left} attempt(s) remaining." if attempts_left > 0 else "Too many incorrect attempts. Please request a new code."
        return False, msg, None

    @classmethod
    def verify_otp(cls, email, otp):
        """Verifies OTP for LOGIN flow (caller handles JWT issuance after success)."""
        success, message, otp_obj = cls._verify_email_otp_record(email, otp)
        if not success:
            return False, message
        otp_obj.is_verified = True
        otp_obj.save()
        return True, "OTP verified."

    @classmethod
    def verify_otp_for_signup(cls, email, otp):
        """Verifies OTP for SIGNUP flow (no JWT/login; just marks the record verified)."""
        success, message, otp_obj = cls._verify_email_otp_record(email, otp)
        if not success:
            return False, message
        otp_obj.is_verified = True
        otp_obj.save()
        return True, "OTP verified successfully for signup."
