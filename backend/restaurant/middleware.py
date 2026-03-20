"""
FILE: backend/restaurant/middleware.py
DESCRIPTION: This file handles API security, role verification, and request logging.
PROJECT PART: Backend (Security Layer)
INTERACTIONS: 
- Decorators are applied to functions in 'restaurant/views.py' and 'users/views.py'.
- 'log_request' keeps a record of all user activities.
- 'require_role' (admin_only, staff_only) prevents unauthorized users from calling certain APIs.
"""

import logging
import functools
import json
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import status

logger = logging.getLogger(__name__)

def log_request(view_func):
    """
    PURPOSE: Automatically logs every detail of an incoming API request to the server console.
    
    BENEFIT: Useful for debugging and tracking which user performed which action.
    
    SECURITY: It automatically hides (masks) passwords and credit card details 
    before writing them to the logs.
    """
    @functools.wraps(view_func)
    def wrapper(*args, **kwargs):
        # Identify the request object
        # args[0] is request (FBV) or self (CBV method) or request (method_decorator)
        request = None
        for arg in args:
            if hasattr(arg, 'user') and hasattr(arg, 'path'):
                request = arg
                break
        
        if not request:
            # Fallback for unexpected signatures
            return view_func(*args, **kwargs)
        
        user = request.user if request.user.is_authenticated else "Anonymous"
        timestamp = timezone.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Capture body (excluding sensitive data)
        body = {}
        if hasattr(request, 'data'):
            body = request.data
        elif hasattr(request, 'body') and request.body:
            try:
                body = json.loads(request.body)
            except:
                body = "Un-parseable body"

        # Mask sensitive fields (Security Best Practice)
        if isinstance(body, dict):
            body = body.copy()
            for key in ['password', 'card_number', 'cvv', 'refresh']:
                if key in body:
                    body[key] = "********"

        logger.info(
            f"[{timestamp}] | User: {user} | Path: {request.path} | Method: {request.method} | Body: {body}"
        )
        return view_func(*args, **kwargs)
    return wrapper

def require_role(allowed_roles):
    """
    PURPOSE: The core logic for Role-Based Access Control (RBAC).
    
    REAL-WORLD ANALOGY: Like a "Bouncer" at a club checking your ID before letting you in. 
    If you're an Admin, you can go anywhere. If you're a Customer, you can't enter the "Staff Only" kitchen.
    
    INPUT: 'allowed_roles' is a list like ['admin', 'employee'].
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(*args, **kwargs):
            # Identify the request object
            request = None
            for arg in args:
                if hasattr(arg, 'user') and hasattr(arg, 'path'):
                    request = arg
                    break

            if not request or not request.user.is_authenticated:
                return JsonResponse(
                    {"status": "error", "message": "Authentication required"}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Superusers (Django Admins) bypass all checks
            if request.user.is_superuser:
                return view_func(*args, **kwargs)

            # Check the custom 'role' field on our User model
            user_role = getattr(request.user, 'role', None)
            if user_role not in allowed_roles:
                logger.warning(f"Access denied for user {request.user} with role {user_role}")
                return JsonResponse(
                    {"status": "error", "message": f"Access denied. Required roles: {allowed_roles}"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(*args, **kwargs)
        return wrapper
    return decorator

# SPECIFIC SECURITY SHORTCUTS:
# These make it easy to protect a view with just one line of code!

# @admin_only: Only the owner/manager can call this (e.g., viewing sales reports).
admin_only = require_role(['admin'])

# @staff_only: Both managers and waiters can call this (e.g., updating order status).
staff_only = require_role(['admin', 'employee'])
