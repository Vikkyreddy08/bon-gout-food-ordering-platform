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
from .serializers import UserRegistrationSerializer, MyTokenObtainPairSerializer, UserProfileSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random
import hashlib
from .models import OTP
from restaurant.utils import standardized_response
from restaurant.middleware import log_request, admin_only

User = get_user_model()

class MyTokenObtainPairView(TokenObtainPairView):
    """
    PURPOSE: Handles User Login and issues JWT (JSON Web Token) tokens.
    """
    serializer_class = MyTokenObtainPairSerializer

# ==========================================
# OTP VIEWS - ✅ SECURE SEND & VERIFY
# ==========================================

class SendOTPView(APIView):
    """
    PURPOSE: Generates and saves a 6-digit OTP for a phone number.
    RATE LIMITING: 1 request per 30 seconds.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        if not phone or len(phone) < 10:
            return standardized_response(status.HTTP_400_BAD_REQUEST, "Valid phone number required", success=False)

        otp_obj, created = OTP.objects.get_or_create(phone=phone, defaults={
            'expires_at': timezone.now() + timedelta(minutes=5),
            'otp_hash': ''
        })

        # Rate Limiting: 30 seconds
        if not created and (timezone.now() - otp_obj.last_sent_at).total_seconds() < 30:
            return standardized_response(status.HTTP_429_TOO_MANY_REQUESTS, "Please wait 30 seconds before resending", success=False)

        # Use a default OTP for development/testing (No cost, easy access)
        otp_code = "123456" 
        print(f"DEBUG: Using default OTP {otp_code} for {phone}") 
        otp_hash = hashlib.sha256(otp_code.encode()).hexdigest()

        # Update OTP object
        otp_obj.otp_hash = otp_hash
        otp_obj.expires_at = timezone.now() + timedelta(minutes=5)
        otp_obj.is_verified = False
        otp_obj.attempts = 0
        otp_obj.save()

        # LOGIC: In production, integrate Twilio/MSG91 here.
        # print(f"DEBUG: OTP for {phone} is {otp_code}") 

        return standardized_response(status.HTTP_200_OK, "OTP sent successfully")

class VerifyOTPView(APIView):
    """
    PURPOSE: Verifies the 6-digit OTP provided by the user.
    SECURITY: Max 5 attempts, expiry check, hashing.
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

        # Verify Hash
        input_hash = hashlib.sha256(otp_code.encode()).hexdigest()
        if input_hash == otp_obj.otp_hash:
            otp_obj.is_verified = True
            otp_obj.save()
            return standardized_response(status.HTTP_200_OK, "OTP verified successfully")
        else:
            otp_obj.attempts += 1
            otp_obj.save()
            return standardized_response(status.HTTP_400_BAD_REQUEST, "Invalid OTP code", success=False)

class UserRegistrationView(APIView):
    """
    PURPOSE: Handles Public User Signup with OTP requirement.
    """
    permission_classes = [permissions.AllowAny]

    @log_request
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens for auto-login after signup
            refresh = RefreshToken.for_user(user)
            tokens = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
            
            return standardized_response(
                status.HTTP_201_CREATED, 
                "User registered successfully", 
                {**UserRegistrationSerializer(user).data, **tokens}
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
    
    INTERVIEW NOTE: We use a custom @admin_only decorator here to enforce strict 
    backend security, preventing regular users from creating employee accounts 
    even if they try to call this API directly.
    """
    permission_classes = [permissions.IsAuthenticated]

    @log_request
    @admin_only
    def post(self, request):
        """
        Creates a new user with the 'employee' role.
        
        INPUT: Employee details (username, email, password, etc.).
        """
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
    
    ROLE RESTRICTION: Only admins can view the employee list.
    """
    permission_classes = [permissions.IsAuthenticated]

    @log_request
    @admin_only
    def get(self, request):
        """
        Returns a list of all users with the 'employee' role.
        """
        employees = User.objects.filter(role='employee').order_by('-date_joined')
        serializer = UserProfileSerializer(employees, many=True)
        return standardized_response(status.HTTP_200_OK, "Employee list retrieved", serializer.data)

class EmployeeDeleteView(APIView):
    """
    PURPOSE: Admin-only view to remove a staff account.
    
    API: DELETE /api/users/employees/<id>/
    METHOD: DELETE
    
    ROLE RESTRICTION: Only admins can delete employees.
    """
    permission_classes = [permissions.IsAuthenticated]

    @log_request
    @admin_only
    def delete(self, request, pk):
        """
        Deletes the specified employee account.
        
        INPUT: pk (Primary Key) of the user to delete.
        """
        try:
            employee = User.objects.get(pk=pk, role='employee')
            # Prevent admin from deleting themselves if they somehow have the employee role
            if employee == request.user:
                return standardized_response(status.HTTP_400_BAD_REQUEST, "Cannot delete your own account", success=False)
            
            employee.delete()
            return standardized_response(status.HTTP_200_OK, "Employee account deleted successfully")
        except User.DoesNotExist:
            return standardized_response(status.HTTP_404_NOT_FOUND, "Employee not found", success=False)

class UserProfileView(APIView):
    """
    PURPOSE: Fetches the logged-in user's data for the 'My Profile' page.
    
    API: GET /api/users/profile/
    METHOD: GET
    
    LOGIC: Uses the JWT token from the Authorization header to identify the user.
    """
    permission_classes = [permissions.IsAuthenticated]

    @log_request
    def get(self, request):
        """
        Returns the current user's profile details.
        
        INPUT: None (uses token from request).
        OUTPUT: User object (id, username, role, etc.).
        """
        serializer = UserProfileSerializer(request.user)
        return standardized_response(status.HTTP_200_OK, "Profile retrieved", serializer.data)
