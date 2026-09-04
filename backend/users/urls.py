"""
FILE: backend/users/urls.py
DESCRIPTION: Defines the URL routing for all user-related API endpoints.
PROJECT PART: Backend (URL Routing)
INTERACTIONS: 
- Maps URL paths (e.g., /api/users/login/) to the logic in 'users/views.py'.
- Included in the main 'bon_gout/urls.py' file.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    MyTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    AddEmployeeView,
    EmployeeListView,
    EmployeeDeleteView,
    SendOTPView,
    VerifyOTPView,
    GoogleLoginView,
    SendEmailOTPView,
    VerifyEmailOTPView,
    SendPhoneOTPView,
    VerifyPhoneOTPView,
    VerifyEmailOTPForSignupView,
    VerifyPhoneOTPForSignupView,
    LogoutView,
    SendPasswordResetOTPView,
    VerifyPasswordResetOTPView,
    ResetPasswordView,
)

urlpatterns = [
    # API: POST /api/users/register/ -> Public signup
    path('register/', UserRegistrationView.as_view(), name='register'),
    
    # API: POST /api/users/send-otp/ -> Sends OTP to phone (legacy)
    path('send-otp/', SendOTPView.as_view(), name='send_otp'),

    # API: POST /api/users/verify-otp/ -> Verifies OTP (legacy)
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    
    # API: POST /api/users/login/ -> JWT login (returns tokens)
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # API: POST /api/users/google-login/ -> Google OAuth login
    path('google-login/', GoogleLoginView.as_view(), name='google_login'),
    
    # API: POST /api/users/token/refresh/ -> Refreshes an expired access token
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API: GET /api/users/profile/ -> Gets profile of logged-in user
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    
    # API: POST /api/users/add-employee/ -> Admin-only staff creation
    path('add-employee/', AddEmployeeView.as_view(), name='add_employee'),
    
    # API: GET /api/users/employees/ -> Admin-only list of all staff
    path('employees/', EmployeeListView.as_view(), name='employee_list'),
    
    # API: DELETE /api/users/employees/<pk>/ -> Admin-only staff removal
    path('employees/<int:pk>/', EmployeeDeleteView.as_view(), name='delete_employee'),
    
    # New auth endpoints under /api/auth/ (added here for now, or we can create separate urls)
    # Email OTP endpoints
    path('send-email-otp/', SendEmailOTPView.as_view(), name='send_email_otp'),
    path('verify-email-otp/', VerifyEmailOTPView.as_view(), name='verify_email_otp'),
    
    # Phone OTP endpoints
    path('send-phone-otp/', SendPhoneOTPView.as_view(), name='send_phone_otp'),
    path('verify-phone-otp/', VerifyPhoneOTPView.as_view(), name='verify_phone_otp'),
    
    # Signup-specific OTP endpoints (no login)
    path('verify-email-otp-signup/', VerifyEmailOTPForSignupView.as_view(), name='verify_email_otp_signup'),
    path('verify-phone-otp-signup/', VerifyPhoneOTPForSignupView.as_view(), name='verify_phone_otp_signup'),
    
    # Logout endpoint
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # Password Reset (Forgot Password) endpoints
    path('send-password-reset-otp/', SendPasswordResetOTPView.as_view(), name='send_password_reset_otp'),
    path('verify-password-reset-otp/', VerifyPasswordResetOTPView.as_view(), name='verify_password_reset_otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
]
