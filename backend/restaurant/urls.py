"""
FILE: backend/restaurant/urls.py
DESCRIPTION: Defines the URL routing for all restaurant features (Menu, Orders, Payments).
PROJECT PART: Backend (URL Routing)
INTERACTIONS: 
- Maps URL paths to 'restaurant/views.py' logic.
- Uses 'DefaultRouter' to automatically generate paths for ViewSets.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# DefaultRouter automatically creates URLs for the standard operations (LIST, CREATE, RETRIEVE, etc.)
router = DefaultRouter()

# API: /api/restaurant/categories/
router.register(r'categories', views.CategoryViewSet, basename='categories')

# API: /api/restaurant/menu/
router.register(r'menu', views.MenuItemViewSet, basename='menu')

# API: /api/restaurant/orders/ -> Used by both customers and staff
router.register(r'orders', views.OrderViewSet, basename='orders')

# API: /api/restaurant/carousel/ -> Homepage banners
router.register(r'carousel', views.CarouselSlideViewSet, basename='carousel')

# API: /api/restaurant/customer-care/ -> Support requests
router.register(r'customer-care', views.CustomerCareViewSet, basename='customer-care')

urlpatterns = [
    # Router paths (LIST, RETRIEVE, etc.)
    path('', include(router.urls)),
    
    # INDIVIDUAL API ENDPOINTS:
    # -------------------------
    
    # API: POST /api/restaurant/payments/create/ -> Gets Razorpay ID
    path('payments/create/', views.create_razorpay_order, name='create_razorpay_order'),
    
    # API: POST /api/restaurant/payments/verify/ -> Verifies payment signature
    path('payments/verify/', views.verify_razorpay_payment, name='verify_razorpay_payment'),
]
