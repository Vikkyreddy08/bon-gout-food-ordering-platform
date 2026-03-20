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

# ==========================================
# CUSTOM USER MODEL - ✅ ADDED ROLE SUPPORT
# ==========================================
class User(AbstractUser):
    """
    PURPOSE: Extends the default Django User to support specific roles needed for a restaurant app.
    
    REAL-WORLD MEANING: 
    - Represents anyone interacting with the system: a Customer (user), a Waiter/Chef (employee), or the Owner (admin).
    
    INTERVIEW NOTE: We use AbstractUser instead of a Profile model because it's cleaner for 
    Role-Based Access Control (RBAC) and integrates natively with Django's auth system.
    """
    
    # ROLE_CHOICES defines the fixed options for user types.
    # Like a dropdown menu in a real-world registration form.
    ROLE_CHOICES = [
        ('user', 'User'),         # Regular customer who orders food
        ('employee', 'Employee'), # Staff member who manages orders
        ('admin', 'Admin'),       # Manager who controls everything
    ]
    
    # Stores the user's role. Defaults to 'user' (Customer).
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='user',
        help_text="Determines what the user can see and do in the app."
    )
    
    # Optional phone number field for order contact.
    phone = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        """Returns a readable name for the user in the Django Admin panel."""
        return f"{self.username} ({self.role})"
