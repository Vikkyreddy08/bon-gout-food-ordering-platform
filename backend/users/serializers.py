"""
FILE: backend/users/serializers.py
DESCRIPTION: This file handles the conversion of User model instances to JSON and vice-versa.
PROJECT PART: Backend (Django REST Framework Serializers)
INTERACTIONS: 
- Acts as a bridge between 'users/models.py' and 'users/views.py'.
- Validates incoming data (passwords, access codes) before saving to the database.
- Adds custom data (like role) to the JWT token for the frontend to use.
"""

import os
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import EmailOTP, PhoneOTP, LoginHistory

User = get_user_model()


class SendEmailOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class VerifyEmailOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, min_length=6, required=True)


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, min_length=6, required=True)
    new_password = serializers.CharField(write_only=True, min_length=8, required=True)
    confirm_password = serializers.CharField(write_only=True, min_length=8, required=True)

    def validate(self, data):
        if data.get('new_password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        password = data.get('new_password')
        if len(password) < 8:
            raise serializers.ValidationError({"new_password": "Password must be at least 8 characters."})
        if not any(c.isupper() for c in password):
            raise serializers.ValidationError({"new_password": "Password must contain at least one uppercase letter."})
        if not any(c.islower() for c in password):
            raise serializers.ValidationError({"new_password": "Password must contain at least one lowercase letter."})
        if not any(c.isdigit() for c in password):
            raise serializers.ValidationError({"new_password": "Password must contain at least one number."})
        return data


class SendPhoneOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15, required=True)


class VerifyPhoneOTPSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True, help_text="Firebase ID token from frontend")
    phone = serializers.CharField(max_length=15, required=False, help_text="Optional: Phone number to verify against")


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    access_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'role', 'phone', 'access_code']

    def validate(self, data):
        role = data.get('role', 'user')
        phone = data.get('phone')
        email = data.get('email')
        
        # Admin Creator Bypass
        request = self.context.get('request')
        is_admin_creator = request and request.user and request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'role', '') == 'admin')

        if is_admin_creator:
            return data

        # 1. OTP VERIFICATION CHECK (Only for regular users)
        if role == 'user':
            # Check if either phone or email is verified using the active OTP tables.
            # NOTE: Legacy `OTP` model is intentionally NOT used here to prevent the
            # hardcoded "123456" OTP endpoint from bypassing real SMS/Email verification.
            phone_verified = False
            email_verified = False

            if phone:
                try:
                    phone_otp_obj = PhoneOTP.objects.get(phone=phone)
                    phone_verified = phone_otp_obj.is_verified
                except PhoneOTP.DoesNotExist:
                    pass

            if email:
                try:
                    email_otp_obj = EmailOTP.objects.get(email=email)
                    email_verified = email_otp_obj.is_verified
                except EmailOTP.DoesNotExist:
                    pass

            if not phone_verified and not email_verified:
                raise serializers.ValidationError({"otp": "Either phone number or email must be verified via OTP."})

        # 2. ROLE-BASED ACCESS CODE VERIFICATION
        access_code = data.get('access_code', '')
        if role == 'admin':
            admin_code = os.getenv('ADMIN_SECRET_CODE')
            if not admin_code:
                # In development, use a fallback, but in production this must be set.
                if os.getenv('DEBUG', 'False').lower() == 'true':
                    admin_code = 'ADMIN123'
                else:
                    raise serializers.ValidationError({"access_code": "ADMIN_SECRET_CODE is not configured in the backend environment."})
            if access_code != admin_code:
                raise serializers.ValidationError({"access_code": "Invalid access code for Admin role."})
        elif role == 'employee':
            employee_code = os.getenv('EMPLOYEE_SECRET_CODE', 'EMP123')
            if access_code != employee_code:
                raise serializers.ValidationError({"access_code": "Invalid access code for Employee role."})
        
        return data

    def validate_password(self, value):
        """
        PURPOSE: Enforces strong security standards for user passwords.
        REQUIREMENTS: 8+ chars, 1 digit, 1 uppercase, 1 lowercase, 1 special char.
        
        INPUT: 'value' is the raw password string.
        """
        if not value:  # Password can be optional for OTP-based registration
            return value
            
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        special_characters = "@$!%*?&"
        if not any(char in special_characters for char in value):
            raise serializers.ValidationError(f"Password must contain at least one special character from {special_characters}")
        return value

    def create(self, validated_data):
        """
        PURPOSE: Creates the new User object in the database.
        LOGIC: 
        - Removes the temporary 'access_code' field.
        - Hashes the password securely using 'set_password' if provided.
        - Sets 'is_staff' and 'is_superuser' for admin roles.
        - Sets 'is_staff' for employee roles.
        - Saves the new user.
        """
        validated_data.pop('access_code', None) # Remove temporary field
        
        # If the role is 'admin', grant staff and superuser permissions
        if validated_data.get('role') == 'admin':
            validated_data['is_staff'] = True
            validated_data['is_superuser'] = True
        # If the role is 'employee', grant staff permissions
        elif validated_data.get('role') == 'employee':
            validated_data['is_staff'] = True

        # Handle password (optional for OTP registration)
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        
        if password:
            user.set_password(password)
            user.save()
            
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    PURPOSE: Converts user profile data to JSON for the 'My Profile' page.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'role', 'phone', 'is_staff']


class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = '__all__'


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    PURPOSE: Customizes the JWT login token and validates the access code for staff.
    LOGIC: We inject the 'role' and 'username' directly into the token.
    SECURITY: Verifies ADMIN_SECRET_CODE or EMPLOYEE_SECRET_CODE during login for those roles.
    """
    def validate(self, attrs):
        # The login form accepts either identifier, while SimpleJWT authenticates by username.
        login_identifier = attrs.get('username', '')
        if '@' in login_identifier:
            account = User.objects.filter(email__iexact=login_identifier).first()
            if account:
                attrs['username'] = account.username

        # First, call the standard validation (username/password check)
        # This will raise a standard DRF error if credentials are wrong.
        data = super().validate(attrs)
        
        # Get the user object from the validated attributes
        user = self.user
        role = getattr(user, 'role', 'user')
        
        # Check if an access_code was provided in the login request
        # We strip whitespace to be more forgiving.
        request_data = self.context.get('request').data if self.context.get('request') else {}
        access_code = str(request_data.get('access_code', '')).strip()
        
        # ROLE-BASED LOGIN VERIFICATION:
        # If the user has a staff role in the DB, they MUST provide the secret key.
        if role == 'admin':
            admin_code = os.getenv('ADMIN_SECRET_CODE')
            if not admin_code:
                # Fallback for production if env var is missing but we are debugging
                admin_code = "ADMIN123" 
            
            if access_code != admin_code:
                # If DEBUG is True, we show a more helpful message for developers.
                if os.getenv('DEBUG', 'False').lower() == 'true' and not os.getenv('ADMIN_SECRET_CODE'):
                    raise serializers.ValidationError({"access_code": "ADMIN_SECRET_CODE not set in backend .env file."})
                raise serializers.ValidationError({"access_code": "Incorrect Admin Passkey. Please select 'Admin' role and enter the correct code."})
        
        elif role == 'employee':
            employee_code = os.getenv('EMPLOYEE_SECRET_CODE')
            if not employee_code:
                employee_code = "EMP123"

            if access_code != employee_code:
                if os.getenv('DEBUG', 'False').lower() == 'true' and not os.getenv('EMPLOYEE_SECRET_CODE'):
                    raise serializers.ValidationError({"access_code": "EMPLOYEE_SECRET_CODE not set in backend .env file."})
                raise serializers.ValidationError({"access_code": "Incorrect Employee Secret Key. Please select 'Employee' role and enter the correct code."})
        
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['role'] = user.role
        token['is_staff'] = user.is_staff
        return token
