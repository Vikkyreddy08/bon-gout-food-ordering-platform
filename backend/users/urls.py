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
from .views import MyTokenObtainPairView, UserRegistrationView, UserProfileView, AddEmployeeView, EmployeeListView, EmployeeDeleteView

urlpatterns = [
    # API: POST /api/users/register/ -> Public signup
    path('register/', UserRegistrationView.as_view(), name='register'),
    
    # API: POST /api/users/login/ -> JWT login (returns tokens)
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
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
]
