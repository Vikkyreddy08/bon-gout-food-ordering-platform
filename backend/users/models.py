"""
FILE: backend/users/models.py
DESCRIPTION: This file defines the core User model for the entire project.
PROJECT PART: Backend (Django Models)
INTERACTIONS: 
- Used by 'users/serializers.py' to convert user data to JSON.
- Used by 'users/views.py' for authentication and registration logic.
- Used throughout the 'restaurant' app to link orders and reviews to specific people.
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import hashlib
import random

# ==========================================
# CUSTOM USER MODEL - ✅ ADDED ROLE SUPPORT
# ==========================================
class User(AbstractUser):
    """
    PURPOSE: Extends the default Django User to support specific roles needed for a restaurant app.
    """
    ROLE_CHOICES = [
        ('user', 'User'),         # Regular customer who orders food
        ('employee', 'Employee'), # Staff member who manages orders
        ('admin', 'Admin'),       # Manager who controls everything
    ]
    
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='user',
        help_text="Determines what the user can see and do in the app."
    )
    
    phone = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


# ==========================================
# EMAIL OTP MODEL
# ==========================================
class EmailOTP(models.Model):
    email = models.EmailField(unique=True)
    otp_hash = models.CharField(max_length=64)  # Hashed OTP for security
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    last_sent_at = models.DateTimeField(auto_now=True)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Email OTP for {self.email} - Verified: {self.is_verified}"

    class Meta:
        verbose_name = "Email OTP Verification"
        verbose_name_plural = "Email OTP Verifications"


# ==========================================
# PHONE OTP MODEL
# ==========================================
class PhoneOTP(models.Model):
    phone = models.CharField(max_length=15, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    last_sent_at = models.DateTimeField(auto_now=True)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Phone OTP for {self.phone} - Verified: {self.is_verified}"

    class Meta:
        verbose_name = "Phone OTP Verification"
        verbose_name_plural = "Phone OTP Verifications"


# ==========================================
# LOGIN HISTORY MODEL
# ==========================================
class LoginHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_history")
    login_time = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    login_method = models.CharField(max_length=50, choices=[
        ('password', 'Password'),
        ('phone_otp', 'Phone OTP'),
        ('email_otp', 'Email OTP'),
        ('google', 'Google OAuth'),
    ])
    success = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - {self.login_method} at {self.login_time}"

    class Meta:
        ordering = ['-login_time']
        verbose_name = "Login History"
        verbose_name_plural = "Login Histories"


# ==========================================
# OTP ATTEMPT MODEL
# ==========================================
class OTPAttempt(models.Model):
    identifier = models.CharField(max_length=255)  # Can be email or phone
    attempt_type = models.CharField(max_length=20, choices=[
        ('email', 'Email'),
        ('phone', 'Phone'),
    ])
    attempts = models.IntegerField(default=0)
    last_attempt_at = models.DateTimeField(auto_now=True)
    cooldown_until = models.DateTimeField(blank=True, null=True)

    def is_in_cooldown(self):
        return self.cooldown_until and timezone.now() < self.cooldown_until

    def __str__(self):
        return f"{self.identifier} ({self.attempt_type}) - Attempts: {self.attempts}"


# ==========================================
# OTP VERIFICATION MODEL (Legacy support, can be kept or removed)
# ==========================================
class OTP(models.Model):
    phone = models.CharField(max_length=15, unique=True)
    otp_hash = models.CharField(max_length=64) # Hashed OTP
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    last_sent_at = models.DateTimeField(auto_now=True)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"OTP for {self.phone} - Verified: {self.is_verified}"

    class Meta:
        verbose_name = "OTP Verification"
        verbose_name_plural = "OTP Verifications"
