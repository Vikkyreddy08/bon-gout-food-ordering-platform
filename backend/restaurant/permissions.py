"""
FILE: backend/restaurant/permissions.py
DESCRIPTION: This file defines custom Django REST Framework (DRF) permission classes.
PROJECT PART: Backend (DRF Permissions)
INTERACTIONS: 
- Used in 'restaurant/views.py' within the 'permission_classes' list of various viewsets.
- Provides a declarative way to protect API endpoints based on user roles.
"""

from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    PURPOSE: Restricts an endpoint to ONLY users with the 'admin' role.
    INTERVIEW NOTE: This is part of our Role-Based Access Control (RBAC) strategy.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

class IsEmployee(permissions.BasePermission):
    """
    PURPOSE: Restricts an endpoint to ONLY users with the 'employee' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'employee')

class IsAdminOrEmployee(permissions.BasePermission):
    """
    PURPOSE: Allows access if the user is EITHER an Admin OR an Employee.
    USE CASE: Managing orders, where both waiters (employee) and managers (admin) need access.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'admin' or request.user.role == 'employee'))

class IsOwnerOrAdminOrEmployee(permissions.BasePermission):
    """
    PURPOSE: Complex permission for order privacy.
    LOGIC: 
    - Admins and Employees can see ANY order.
    - Regular Users can ONLY see orders that belong to them (obj.user == request.user).
    
    REAL-WORLD ANALOGY: A customer can only see their own bill, but the waiter can see all bills for the day.
    """
    def has_object_permission(self, request, view, obj):
        # Admin and Employee can see/edit everything
        if request.user.role in ['admin', 'employee']:
            return True
        # Users can only see/edit their own orders
        return obj.user == request.user
