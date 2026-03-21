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
from .serializers import UserRegistrationSerializer, MyTokenObtainPairSerializer, UserProfileSerializer
from django.contrib.auth import get_user_model
from restaurant.utils import standardized_response
from restaurant.middleware import log_request, admin_only

User = get_user_model()

class MyTokenObtainPairView(TokenObtainPairView):
    """
    PURPOSE: Handles User Login and issues JWT (JSON Web Token) tokens.
    
    API: POST /api/users/login/
    METHOD: POST
    
    INPUTS: username, password.
    EXPECTED RESPONSE: { "access": "...", "refresh": "..." } + custom user data like 'role'.
    
    INTERVIEW NOTE: We use JWT (JSON Web Token) for authentication. 
    It's stateless, meaning the server doesn't need to store sessions, 
    making the app more scalable.
    """
    serializer_class = MyTokenObtainPairSerializer

class UserRegistrationView(APIView):
    """
    PURPOSE: Handles Public User Signup (Customers).
    
    API: POST /api/users/register/
    METHOD: POST
    
    LOGIC: Anyone can access this (AllowAny). Validates data and creates a 'user' role by default.
    """
    permission_classes = [permissions.AllowAny]

    @log_request
    def post(self, request):
        """
        Processes the signup request and returns a standardized success/error response.
        
        INPUT: 'request.data' containing user details from React.
        """
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            # If valid, save() calls the 'create' method in serializers.py
            user = serializer.save()
            return standardized_response(
                status.HTTP_201_CREATED, 
                "User registered successfully", 
                UserRegistrationSerializer(user).data
            )
        # If invalid, flatten errors for a readable message (e.g. "Validation failed: username: Already taken")
        # We also log the full errors to the server for debugging.
        full_errors = serializer.errors
        error_msg = "Validation failed: "
        
        details = []
        for field, errors in full_errors.items():
            details.append(f"{field}: {errors[0]}")
        
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
