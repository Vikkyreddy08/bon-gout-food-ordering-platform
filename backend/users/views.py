"""
FILE: backend/users/views.py
DESCRIPTION: This file contains the logic for handling user-related API requests.
PROJECT PART: Backend (Django Views)
INTERACTIONS: 
- Uses 'users/serializers.py' to process incoming data.
- Defines endpoints for Login, Signup, and Profile management.
- Integrates with 'restaurant/middleware.py' for logging and security checks.
"""

from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    UserRegistrationSerializer,
    MyTokenObtainPairSerializer,
    UserProfileSerializer,
    SendEmailOTPSerializer,
    VerifyEmailOTPSerializer,
    SendPhoneOTPSerializer,
    VerifyPhoneOTPSerializer,
    LoginHistorySerializer,
    PasswordResetSerializer
)
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import OTP, EmailOTP, LoginHistory
from restaurant.utils import standardized_response
from restaurant.middleware import log_request, admin_only
from .services.email_service import EmailOTPService
from .services.phone_service import PhoneOTPService
from .services.otp_service import generate_otp, hash_otp as secure_hash_otp

# Google OAuth imports
from google.oauth2 import id_token  # noqa: F401  (used as google.oauth2.id_token.verify_oauth2_token below)
from google.auth.transport import requests
import os
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


def get_client_ip(request):
    """Helper function to get client IP address."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class MyTokenObtainPairView(TokenObtainPairView):
    """
    PURPOSE: Handles User Login and issues JWT (JSON Web Token) tokens.
    """
    serializer_class = MyTokenObtainPairSerializer


# ==========================================
# EMAIL OTP VIEWS
# ==========================================
class SendEmailOTPView(APIView):
    """
    API: POST /api/auth/send-email-otp/
    PURPOSE: Sends OTP to email address via Gmail SMTP.
    """
    permission_classes = [permissions.AllowAny]

    @log_request
    def post(self, request):
        serializer = SendEmailOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return standardized_response(
                status.HTTP_400_BAD_REQUEST,
                "Validation failed",
                success=False,
                data=serializer.errors
            )

        email = serializer.validated_data['email']
        try:
            success, message = EmailOTPService.send_otp(email)
        except Exception as e:
            logger.error(f"SendEmailOTPView error for {email[:4]}***: {str(e)}", exc_info=True)
            return standardized_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Email OTP service is temporarily unavailable. Please try again later or use phone signup.",
                success=False
            )

        if success:
            return standardized_response(status.HTTP_200_OK, message)
        else:
            status_code = status.HTTP_429_TOO_MANY_REQUESTS if 'wait' in message.lower() else status.HTTP_502_BAD_GATEWAY
            return standardized_response(status_code, message, success=False)


class VerifyEmailOTPView(APIView):
    """
    API: POST /api/auth/verify-email-otp/
    PURPOSE: Verifies email OTP and authenticates user.
    """
    permission_classes = [permissions.AllowAny]

    @log_request
    def post(self, request):
        serializer = VerifyEmailOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return standardized_response(
                status.HTTP_400_BAD_REQUEST,
                "Validation failed",
                success=False,
                data=serializer.errors
            )

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']

        try:
            success, message = EmailOTPService.verify_otp(email, otp)
        except Exception as e:
            logger.error(f"VerifyEmailOTPView error for {email[:4]}***: {str(e)}", exc_info=True)
            return standardized_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Email verification service error. Please try again.",
                success=False
            )

        if not success:
            return standardized_response(status.HTTP_400_BAD_REQUEST, message, success=False)

        # Get or create user
        username = email.split('@')[0]
        try:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'role': 'user',
                    'password': None
                }
            )
        except Exception as e:
            logger.error(f"VerifyEmailOTPView user creation error: {str(e)}", exc_info=True)
            return standardized_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Account service error. Please try again later.",
                success=False
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        tokens = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

        try:
            LoginHistory.objects.create(
                user=user,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                login_method='email_otp',
                success=True
            )
        except Exception:
            logger.warning(f"Failed to create login history for user {user.id}", exc_info=True)

        return standardized_response(
            status.HTTP_200_OK,
            "Email OTP verified and login successful",
            {**tokens, 'user': UserProfileSerializer(user).data}
        )


# ==========================================
# PHONE OTP VIEWS (Firebase)
# ==========================================
class SendPhoneOTPView(APIView):
    """
    API: POST /api/auth/send-phone-otp/
    PURPOSE: Checks resend cooldown for phone OTP (actual sending done via Firebase on frontend).
    """
    permission_classes = [permissions.AllowAny]

    @log_request
    def post(self, request):
        serializer = SendPhoneOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return standardized_response(
                status.HTTP_400_BAD_REQUEST,
                "Validation failed",
                success=False,
                data=serializer.errors
            )

        phone = serializer.validated_data['phone']
        try:
            success, message = PhoneOTPService.check_resend_cooldown(phone)
        except Exception as e:
            logger.error(f"SendPhoneOTPView error for {phone[:4]}***: {str(e)}", exc_info=True)
            return standardized_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Phone OTP service is temporarily unavailable. Please use email signup instead.",
                success=False
            )

        if success:
            return standardized_response(status.HTTP_200_OK, message)
        else:
            return standardized_response(status.HTTP_429_TOO_MANY_REQUESTS, message, success=False)


class VerifyPhoneOTPView(APIView):
    """
    API: POST /api/auth/verify-phone-otp/
    PURPOSE: Verifies Firebase token + PhoneOTP record and authenticates user.
    """
    permission_classes = [permissions.AllowAny]

    @log_request
    def post(self, request):
        serializer = VerifyPhoneOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return standardized_response(
                status.HTTP_400_BAD_REQUEST,
                "Validation failed",
                success=False,
                data=serializer.errors
            )

        id_token = serializer.validated_data['id_token']
        phone = serializer.validated_data.get('phone')

        try:
            success, message, verified_phone = PhoneOTPService.verify_otp_for_login(id_token, phone)
        except Exception as e:
            logger.error(f"VerifyPhoneOTPView error: {str(e)}", exc_info=True)
            return standardized_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Phone verification service error. Please try again or use email login.",
                success=False
            )

        if not success:
            code = status.HTTP_401_UNAUTHORIZED if 'mismatch' in message.lower() or 'failed' in message.lower() else status.HTTP_400_BAD_REQUEST
            return standardized_response(code, message, success=False)

        # Get or create user
        username = verified_phone.replace('+', '')  # Use phone as username without '+'
        user, created = User.objects.get_or_create(
            phone=verified_phone,
            defaults={
                'username': username,
                'role': 'user',
                'password': None
            }
        )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        tokens = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

        # Log login history
        LoginHistory.objects.create(
            user=user,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            login_method='phone_otp',
            success=True
        )

        return standardized_response(
            status.HTTP_200_OK,
            "Phone OTP verified and login successful",
            {**tokens, 'user': UserProfileSerializer(user).data}
        )


# ==========================================
# SIGNUP-SPECIFIC OTP VIEWS (NO LOGIN)
# ==========================================
class VerifyEmailOTPForSignupView(APIView):
    """
    API: POST /api/users/verify-email-otp-signup/
    PURPOSE: Verifies email OTP for signup without logging in.
    """
    permission_classes = [permissions.AllowAny]

    @log_request
    def post(self, request):
        serializer = VerifyEmailOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return standardized_response(
                status.HTTP_400_BAD_REQUEST,
                "Validation failed",
                success=False,
                data=serializer.errors
            )

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        try:
            success, message = EmailOTPService.verify_otp_for_signup(email, otp)
        except Exception as e:
            logger.error(f"VerifyEmailOTPForSignupView error for {email[:4]}***: {str(e)}", exc_info=True)
            return standardized_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Email verification service error. Please try again.",
                success=False
            )
        if success:
            return standardized_response(status.HTTP_200_OK, message)
        else:
            return standardized_response(status.HTTP_400_BAD_REQUEST, message, success=False)


class VerifyPhoneOTPForSignupView(APIView):
    """
    API: POST /api/users/verify-phone-otp-signup/
    PURPOSE: Verifies phone OTP (Firebase token) for signup without logging in.
    """
    permission_classes = [permissions.AllowAny]

    @log_request
    def post(self, request):
        from .serializers import VerifyPhoneOTPSerializer
        serializer = VerifyPhoneOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return standardized_response(
                status.HTTP_400_BAD_REQUEST,
                "Validation failed",
                success=False,
                data=serializer.errors
            )
        id_token = serializer.validated_data['id_token']
        phone = serializer.validated_data.get('phone')
        try:
            success, message = PhoneOTPService.verify_otp_for_signup(id_token, phone)
        except Exception as e:
            logger.error(f"VerifyPhoneOTPForSignupView error: {str(e)}", exc_info=True)
            return standardized_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Phone verification service error. Please try again or use email signup.",
                success=False
            )
        if success:
            return standardized_response(status.HTTP_200_OK, message)
        else:
            return standardized_response(status.HTTP_400_BAD_REQUEST, message, success=False)


# ==========================================
# LEGACY OTP VIEWS (for backward compatibility)
# ==========================================
class SendOTPView(APIView):
    """
    PURPOSE: Generates and saves a 6-digit OTP for a phone number (LEGACY endpoint).
    NOTE: The active production phone flow uses Firebase OTP via /send-phone-otp/.
    RATE LIMITING: 1 request per 30 seconds.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        if not phone or len(phone) < 10:
            return standardized_response(status.HTTP_400_BAD_REQUEST, "Valid phone number required", success=False)

        now = timezone.now()
        otp_obj, created = OTP.objects.get_or_create(phone=phone, defaults={
            'expires_at': now + timedelta(minutes=5),
            'otp_hash': ''
        })

        # Rate Limiting: 30 seconds
        if not created and (now - otp_obj.last_sent_at).total_seconds() < 30:
            return standardized_response(status.HTTP_429_TOO_MANY_REQUESTS, "Please wait 30 seconds before resending", success=False)

        # Preserve attempts counter if the existing OTP is still active
        reset_attempts = True
        if not created and not otp_obj.is_verified and not otp_obj.is_expired():
            reset_attempts = False

        # Secure random OTP (not hardcoded) - hash uses the shared otp_service.hash_otp
        # so VerifyOTPView's simple SHA-256 check must be updated accordingly.
        otp_code = generate_otp()
        # NOTE: Legacy VerifyOTPView below uses raw hashlib.sha256 for comparison,
        # but our shared otp_service.hash_otp now includes SECRET_KEY as pepper.
        # Since this legacy flow is no longer checked by the serializer, we use the
        # peppered hash for security and the VerifyOTPView has been updated to use
        # the shared otp_service.verify_otp function instead of a raw hash compare.
        otp_hash = secure_hash_otp(otp_code)

        logger.info(f"Legacy OTP generated for phone {phone[:4]}*** (masked)")

        # Update OTP object
        otp_obj.otp_hash = otp_hash
        otp_obj.expires_at = now + timedelta(minutes=5)
        otp_obj.is_verified = False
        otp_obj.attempts = 0 if reset_attempts else otp_obj.attempts
        otp_obj.save()

        # IMPORTANT: This legacy endpoint does NOT actually send SMS.
        # For real production SMS sending, use the Firebase flow via /send-phone-otp/.
        return standardized_response(status.HTTP_200_OK, "OTP generated (legacy endpoint). Use Firebase flow for real SMS.")


class VerifyOTPView(APIView):
    """
    PURPOSE: Verifies the 6-digit OTP provided by the user (LEGACY endpoint).
    NOTE: Active production phone flow uses Firebase OTP via /verify-phone-otp/.
    SECURITY: Max 5 attempts, expiry check, constant-time hash comparison.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        otp_code = request.data.get('otp')

        if not phone or not otp_code:
            return standardized_response(status.HTTP_400_BAD_REQUEST, "Phone and OTP required", success=False)

        try:
            otp_obj = OTP.objects.get(phone=phone)
        except OTP.DoesNotExist:
            return standardized_response(status.HTTP_404_NOT_FOUND, "No OTP found for this number", success=False)

        if otp_obj.is_expired():
            return standardized_response(status.HTTP_400_BAD_REQUEST, "OTP has expired", success=False)

        if otp_obj.attempts >= 5:
            return standardized_response(status.HTTP_400_BAD_REQUEST, "Max attempts reached. Please resend OTP.", success=False)

        # Verify Hash using the shared otp_service function (peppered + constant-time compare)
        from .services.otp_service import verify_otp as verify_hash
        if verify_hash(otp_code, otp_obj.otp_hash):
            otp_obj.is_verified = True
            otp_obj.save()
            logger.info(f"Legacy OTP verified for phone {phone[:4]}*** (masked)")
            return standardized_response(status.HTTP_200_OK, "OTP verified successfully")
        else:
            otp_obj.attempts += 1
            otp_obj.save()
            attempts_left = max(5 - otp_obj.attempts, 0)
            msg = f"Invalid OTP code. {attempts_left} attempt(s) remaining." if attempts_left > 0 else "Max attempts reached. Please resend OTP."
            return standardized_response(status.HTTP_400_BAD_REQUEST, msg, success=False)


class UserRegistrationView(APIView):
    """
    PURPOSE: Handles Public User Signup with OTP requirement.
    """
    permission_classes = [permissions.AllowAny]

    @log_request
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens for auto-login after signup
            refresh = RefreshToken.for_user(user)
            tokens = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
            
            profile = UserProfileSerializer(user).data
            return standardized_response(
                status.HTTP_201_CREATED, 
                "User registered successfully", 
                {
                    **tokens,
                    'user': profile,
                    'role': profile.get('role', 'user'),
                    'username': profile.get('username'),
                    'email': profile.get('email'),
                }
            )
        
        full_errors = serializer.errors
        error_msg = "Validation failed: "
        details = [f"{field}: {errors[0]}" for field, errors in full_errors.items()]
        error_msg += " | ".join(details)
        
        return standardized_response(status.HTTP_400_BAD_REQUEST, error_msg, success=False)


class AddEmployeeView(APIView):
    """
    PURPOSE: Admin-only portal to create new staff accounts (Employee role).
    
    API: POST /api/users/add-employee/
    METHOD: POST
    
    ROLE RESTRICTION: Only users with 'admin' role can successfully call this.
    """
    permission_classes = [permissions.IsAuthenticated]

    @log_request
    @admin_only
    def post(self, request):
        # We copy the request data and force the role to 'employee'
        data = request.data.copy()
        data['role'] = 'employee' 
        
        # Pass 'request' in context so serializer knows an admin is performing the action
        serializer = UserRegistrationSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            return standardized_response(
                status.HTTP_201_CREATED,
                "Employee account created successfully",
                UserProfileSerializer(user).data
            )
        
        error_msg = "Validation failed: " + ", ".join([f"{k}: {v[0]}" for k, v in serializer.errors.items()])
        return standardized_response(status.HTTP_400_BAD_REQUEST, error_msg, success=False)


class EmployeeListView(APIView):
    """
    PURPOSE: Admin-only view to see and manage the staff list.
    
    API: GET /api/users/employees/
    METHOD: GET
    """
    permission_classes = [permissions.IsAuthenticated]

    @log_request
    @admin_only
    def get(self, request):
        employees = User.objects.filter(role='employee').order_by('-date_joined')
        serializer = UserProfileSerializer(employees, many=True)
        return standardized_response(status.HTTP_200_OK, "Employee list retrieved", serializer.data)


class EmployeeDeleteView(APIView):
    """
    PURPOSE: Admin-only view to remove a staff account.
    
    API: DELETE /api/users/employees/<id>/
    METHOD: DELETE
    """
    permission_classes = [permissions.IsAuthenticated]

    @log_request
    @admin_only
    def delete(self, request, pk):
        try:
            employee = User.objects.get(pk=pk, role='employee')
            if employee == request.user:
                return standardized_response(status.HTTP_400_BAD_REQUEST, "Cannot delete your own account", success=False)
            
            employee.delete()
            return standardized_response(status.HTTP_200_OK, "Employee account deleted successfully")
        except User.DoesNotExist:
            return standardized_response(status.HTTP_404_NOT_FOUND, "Employee not found", success=False)


class GoogleLoginView(APIView):
    """
    PURPOSE: Handles Google OAuth login and registration.
    API: POST /api/users/google-login/
    """
    permission_classes = [permissions.AllowAny]

    @log_request
    def post(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            google_id_token = request.data.get('id_token')
            client_id = os.getenv('GOOGLE_CLIENT_ID')
            
            logger.info(f"GoogleLoginView: Received ID token for verification")
            
            if not google_id_token:
                return standardized_response(
                    status.HTTP_400_BAD_REQUEST,
                    "ID token is required",
                    success=False
                )

            # Verify the Google ID token
            try:
                id_info = id_token.verify_oauth2_token(
                    google_id_token,
                    requests.Request(),
                    audience=client_id
                )
                logger.info(f"GoogleLoginView: Token verified successfully for email {id_info.get('email')}")
            except Exception as e:
                logger.error(f"GoogleLoginView: Token verification failed: {str(e)}", exc_info=True)
                return standardized_response(
                    status.HTTP_401_UNAUTHORIZED,
                    "Invalid Google token",
                    success=False
                )

            # Get user information from Google
            google_id = id_info['sub']
            email = id_info.get('email')
            first_name = id_info.get('given_name', '')
            last_name = id_info.get('family_name', '')
            username = email.split('@')[0] if email else f'google_user_{google_id}'

            # Check if user already exists with this Google ID or email
            user = User.objects.filter(email=email).first() if email else None

            if not user:
                # Create new user if doesn't exist
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    role='user',  # Google login users are regular customers
                    password=None  # No password for Google users
                )

            # Log login history
            LoginHistory.objects.create(
                user=user,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                login_method='google',
                success=True
            )

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            tokens = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }

            return standardized_response(
                status.HTTP_200_OK,
                "Google login successful",
                {**tokens, 'user': UserProfileSerializer(user).data}
            )
        except Exception as e:
            return standardized_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                f"Error during Google login: {str(e)}",
                success=False
            )


class UserProfileView(APIView):
    """
    PURPOSE: Fetches the logged-in user's data for the 'My Profile' page.
    
    API: GET /api/auth/profile/ or /api/users/profile/
    METHOD: GET
    """
    permission_classes = [permissions.IsAuthenticated]

    @log_request
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return standardized_response(status.HTTP_200_OK, "Profile retrieved", serializer.data)


class LogoutView(APIView):
    """
    API: POST /api/auth/logout/
    PURPOSE: Logs out user by blacklisting refresh token.
    """
    permission_classes = [permissions.IsAuthenticated]

    @log_request
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return standardized_response(status.HTTP_200_OK, "Logged out successfully")
        except Exception as e:
            return standardized_response(
                status.HTTP_400_BAD_REQUEST,
                "Invalid or expired token",
                success=False
            )


# ==========================================
# PASSWORD RESET VIEWS (Forgot Password Flow)
# ==========================================
class SendPasswordResetOTPView(APIView):
    """
    API: POST /api/users/send-password-reset-otp/
    PURPOSE: Sends email OTP to allow user to reset their password.
    IMPORTANT: Always returns success even if email doesn't exist (security - prevents email enumeration).
    """
    permission_classes = [permissions.AllowAny]

    @log_request
    def post(self, request):
        serializer = SendEmailOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return standardized_response(
                status.HTTP_400_BAD_REQUEST,
                "Validation failed",
                success=False
            )
        email = serializer.validated_data['email']
        try:
            user = User.objects.filter(email=email).first()
            if not user:
                logger.info(f"Password reset OTP requested for non-existent email: {email[:4]}***")
                return standardized_response(
                    status.HTTP_200_OK,
                    "If an account exists with this email, a password reset OTP has been sent."
                )
            if not user.password or not user.has_usable_password():
                return standardized_response(
                    status.HTTP_400_BAD_REQUEST,
                    "This account does not have a password set (e.g. Google sign-in). Please sign in with Google or contact support.",
                    success=False
                )
            try:
                success, message = EmailOTPService.send_otp(email)
            except Exception as e:
                logger.error(f"SendPasswordResetOTPView error for {email[:4]}***: {str(e)}", exc_info=True)
                return standardized_response(
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                    "Password reset service is temporarily unavailable. Please try again later.",
                    success=False
                )
            if success:
                return standardized_response(
                    status.HTTP_200_OK,
                    "If an account exists with this email, a password reset OTP has been sent."
                )
            status_code = status.HTTP_429_TOO_MANY_REQUESTS if 'wait' in message.lower() else status.HTTP_400_BAD_REQUEST
            return standardized_response(status_code, message, success=False)
        except Exception as e:
            logger.error(f"SendPasswordResetOTPView unexpected error: {str(e)}", exc_info=True)
            return standardized_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Password reset service is temporarily unavailable. Please try again later.",
                success=False
            )


class VerifyPasswordResetOTPView(APIView):
    """
    API: POST /api/users/verify-password-reset-otp/
    PURPOSE: Verifies the password reset OTP without resetting.
    Frontend uses this to advance from Step 2 → Step 3 of the flow.
    """
    permission_classes = [permissions.AllowAny]

    @log_request
    def post(self, request):
        serializer = VerifyEmailOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return standardized_response(
                status.HTTP_400_BAD_REQUEST,
                "Validation failed",
                success=False
            )
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        try:
            user = User.objects.filter(email=email).first()
            if not user:
                return standardized_response(
                    status.HTTP_400_BAD_REQUEST,
                    "No account found for this email.",
                    success=False
                )
            try:
                success, message, _otp_obj = EmailOTPService._verify_email_otp_record(email, otp)
            except Exception as e:
                logger.error(f"VerifyPasswordResetOTPView error for {email[:4]}***: {str(e)}", exc_info=True)
                return standardized_response(
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                    "Password reset verification error. Please try again.",
                    success=False
                )
            if not success:
                return standardized_response(status.HTTP_400_BAD_REQUEST, message, success=False)
            return standardized_response(status.HTTP_200_OK, "OTP verified. You may now set a new password.")
        except Exception as e:
            logger.error(f"VerifyPasswordResetOTPView unexpected error: {str(e)}", exc_info=True)
            return standardized_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Password reset verification error. Please try again.",
                success=False
            )


class ResetPasswordView(APIView):
    """
    API: POST /api/users/reset-password/
    PURPOSE: Verifies OTP and sets the new password.
    """
    permission_classes = [permissions.AllowAny]

    @log_request
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            full_errors = serializer.errors
            error_msg = "Validation failed: "
            details = [f"{field}: {errors[0]}" for field, errors in full_errors.items()]
            error_msg += " | ".join(details)
            return standardized_response(status.HTTP_400_BAD_REQUEST, error_msg, success=False)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']
        try:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                logger.warning(f"ResetPassword attempted on missing email {email[:4]}***")
                return standardized_response(
                    status.HTTP_400_BAD_REQUEST,
                    "No account found for this email.",
                    success=False
                )

            try:
                success, message, otp_obj = EmailOTPService._verify_email_otp_record(email, otp)
            except Exception as e:
                logger.error(f"ResetPasswordView verify error for {email[:4]}***: {str(e)}", exc_info=True)
                return standardized_response(
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                    "Password reset error. Please try again.",
                    success=False
                )

            if not success:
                return standardized_response(status.HTTP_400_BAD_REQUEST, message, success=False)

            # Final password validation
            if user.has_usable_password() and user.check_password(new_password):
                return standardized_response(
                    status.HTTP_400_BAD_REQUEST,
                    "New password cannot be the same as your current password.",
                    success=False
                )

            user.set_password(new_password)
            user.save()

            # Mark the OTP as verified so it cannot be reused for another reset
            if otp_obj:
                try:
                    otp_obj.is_verified = True
                    otp_obj.save(update_fields=['is_verified'])
                except Exception as e:
                    logger.warning(f"ResetPasswordView: Failed to mark OTP verified for {email[:4]}***: {str(e)}", exc_info=True)

            logger.info(f"Password reset completed for user {user.id} ({email[:4]}***)")

            try:
                LoginHistory.objects.create(
                    user=user,
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    login_method='password_reset',
                    success=True
                )
            except Exception:
                logger.warning(f"Failed to create password reset login history for user {user.id}", exc_info=True)

            return standardized_response(status.HTTP_200_OK, "Password reset successful. You may now log in with your new password.")
        except Exception as e:
            logger.error(f"ResetPasswordView unexpected error: {str(e)}", exc_info=True)
            return standardized_response(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Password reset error. Please try again.",
                success=False
            )
