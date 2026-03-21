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

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    PURPOSE: Handles new user signups.
    
    SPECIAL FEATURES:
    - password: write_only (never sent back to frontend for security).
    - access_code: used to verify Admin/Employee signup attempts.
    
    INPUTS: username, email, password, first_name, role, phone, access_code.
    OUTPUTS: A User model instance (or validation errors).
    
    INTERVIEW NOTE: We implement custom 'validate' and 'create' methods to handle 
    security logic like access code verification and password hashing.
    """
    # password: CharField that only accepts data (write_only). 
    # We never want to send the hashed password back to the user!
    password = serializers.CharField(write_only=True)
    
    # access_code: A temporary field used only for signup verification.
    # It is not stored in the database.
    access_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        # Link this serializer to the User model we defined in models.py
        model = User
        # These are the fields that can be sent/received via JSON
        fields = ['id', 'username', 'email', 'password', 'first_name', 'role', 'phone', 'access_code']

    def validate(self, data):
        """
        PURPOSE: Security check for roles.
        LOGIC: 
        - If someone tries to sign up as 'admin', they MUST provide the secret code from the .env file.
        - If someone tries to sign up as 'employee', they MUST provide the employee secret code.
        - Regular users don't need a code.
        
        ANALOGY: Like a "VIP entrance" that requires a special password to get in.
        
        INPUT: 'data' is a dictionary of the fields sent from the React frontend.
        OUTPUT: Returns the validated data dictionary if all checks pass.
        """
        role = data.get('role', 'user') # Defaults to 'user' if role is missing
        access_code = data.get('access_code', '')
        
        # Get the request context to check if a logged-in admin is creating this user.
        # This is useful for the 'Add Employee' page where an admin shouldn't need the secret key.
        request = self.context.get('request')
        is_admin_creator = request and request.user and request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'role', '') == 'admin')

        # Skip code verification if an authorized admin is performing the creation.
        if is_admin_creator:
            return data

        # ROLE-BASED VERIFICATION:
        if role == 'admin':
            # Check if the provided code matches the one hidden in our server's .env file
            admin_code = os.getenv('ADMIN_SECRET_CODE')
            if not admin_code:
                # Fallback for production if env var is missing but we are debugging
                admin_code = "ADMIN123" 
            
            if access_code != admin_code:
                raise serializers.ValidationError({"access_code": "Invalid access code for Admin role."})
        
        elif role == 'employee':
            # Check if the provided code matches the employee secret key
            employee_code = os.getenv('EMPLOYEE_SECRET_CODE')
            if not employee_code:
                employee_code = "EMP123"

            if access_code != employee_code:
                raise serializers.ValidationError({"access_code": "Invalid access code for Employee role."})
        
        return data

    def validate_password(self, value):
        """
        PURPOSE: Enforces strong security standards for user passwords.
        REQUIREMENTS: 8+ chars, 1 digit, 1 uppercase, 1 lowercase, 1 special char.
        
        INPUT: 'value' is the raw password string.
        """
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
        - Hashes the password securely using 'set_password'.
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

        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    """
    PURPOSE: Converts user profile data to JSON for the 'My Profile' page.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'role', 'phone', 'is_staff']

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    PURPOSE: Customizes the JWT login token and validates the access code for staff.
    LOGIC: We inject the 'role' and 'username' directly into the token.
    SECURITY: Verifies ADMIN_SECRET_CODE or EMPLOYEE_SECRET_CODE during login for those roles.
    """
    def validate(self, attrs):
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
