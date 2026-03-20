"""
FILE: backend/restaurant/views.py
DESCRIPTION: Logic for handling all restaurant-related API requests (Orders, Menu, Payments).
PROJECT PART: Backend (Django Views & ViewSets)
INTERACTIONS: 
- Uses 'restaurant/serializers.py' to format data.
- Calls 'restaurant/services.py' for complex tasks like Razorpay integration.
- Enforces Role-Based Access Control (RBAC) using decorators like @admin_only and @staff_only.
"""

import logging
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Category, MenuItem, Order, Review, CarouselSlide, CustomerCareRequest
from .serializers import (
    CategorySerializer, 
    MenuItemSerializer, 
    ReviewSerializer, 
    OrderSerializer,
    CarouselSlideSerializer,
    CustomerCareSerializer
)
from .services import (
    create_razorpay_order_api, 
    verify_razorpay_signature, 
    send_order_invoice,
    create_order_with_items
)
from .middleware import log_request, staff_only, admin_only
from .utils import standardized_response, validate_order_payload

logger = logging.getLogger(__name__)

# ==========================================
# PAYMENT VIEWS
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@log_request
def create_razorpay_order(request):
    """
    PURPOSE: Prepares a secure transaction with Razorpay.
    LOGIC: Sends the order amount to Razorpay and gets back a 'Razorpay Order ID'.
    API: POST /api/restaurant/payments/create/
    """
    amount = request.data.get('amount')
    if not amount:
        return standardized_response(status.HTTP_400_BAD_REQUEST, "Amount is required", success=False)

    try:
        razor_order = create_razorpay_order_api(amount)
        return standardized_response(status.HTTP_201_CREATED, "Razorpay order created", razor_order)
    except Exception as e:
        return standardized_response(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e), success=False)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@log_request
def verify_razorpay_payment(request):
    """
    PURPOSE: Finalizes the payment after the user pays in the Razorpay popup.
    SECURITY: Uses HMAC-SHA256 signature verification to prevent fake payment success messages.
    WORKFLOW: 
    1. Verify signature.
    2. Update order status to 'confirmed'.
    3. Send email invoice to the customer.
    API: POST /api/restaurant/payments/verify/
    """
    razorpay_order_id = request.data.get('razorpay_order_id')
    razorpay_payment_id = request.data.get('razorpay_payment_id')
    razorpay_signature = request.data.get('razorpay_signature')
    order_number = request.data.get('order_number')

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, order_number]):
        return standardized_response(status.HTTP_400_BAD_REQUEST, "Missing parameters", success=False)

    is_valid = verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    
    if not is_valid:
        logger.error(f"Payment verification failed for Order #{order_number}")
        return standardized_response(status.HTTP_400_BAD_REQUEST, "Payment spoofing detected", success=False)

    try:
        with transaction.atomic():
            order = Order.objects.get(order_number=order_number)
            order.status = 'confirmed'
            order.payment_id = razorpay_payment_id
            order.save()
            send_order_invoice(order)
            
        return standardized_response(status.HTTP_200_OK, "Payment verified and order confirmed", {
            "order_number": order.order_number,
            "status": order.status
        })
    except Order.DoesNotExist:
        return standardized_response(status.HTTP_404_NOT_FOUND, "Order not found", success=False)
    except Exception as e:
        return standardized_response(status.HTTP_500_INTERNAL_SERVER_ERROR, "Processing failed", success=False)


# ==========================================
# CORE VIEWSETS
# ==========================================

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    PURPOSE: Provides the list of food categories (Starters, Main, etc.).
    API: GET /api/restaurant/categories/
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        """Fetches all food categories with optional pagination."""
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            return standardized_response(status.HTTP_200_OK, "Categories retrieved", response.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return standardized_response(status.HTTP_200_OK, "Categories retrieved", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Fetches a single food category."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return standardized_response(status.HTTP_200_OK, "Category retrieved", serializer.data)

class MenuItemViewSet(viewsets.ModelViewSet):
    """
    PURPOSE: Manages the full Menu.
    ROLE RESTRICTION: Anyone can 'list' (view) items, but only authenticated users can 'add_review'.
    API: GET /api/restaurant/menu/
    """
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer

    def get_permissions(self):
        """Allows public viewing but requires login for modifications."""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [permissions.IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        """Fetches all menu items, with optional filtering and pagination."""
        queryset = self.filter_queryset(self.get_queryset())
        is_featured = request.query_params.get('is_featured')
        if is_featured:
            queryset = queryset.filter(is_featured=is_featured.lower() == 'true')
            
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            return standardized_response(status.HTTP_200_OK, "Menu items retrieved", response.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return standardized_response(status.HTTP_200_OK, "Menu items retrieved", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Fetches a single menu item."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return standardized_response(status.HTTP_200_OK, "Menu item retrieved", serializer.data)

    @action(detail=True, methods=['post'])
    @permission_classes([IsAuthenticated])
    def add_review(self, request, pk=None):
        """Allows a customer to rate and comment on a specific dish."""
        menu_item = self.get_object()
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            if Review.objects.filter(dish=menu_item, user=request.user).exists():
                return standardized_response(status.HTTP_400_BAD_REQUEST, "Already reviewed", success=False)
            serializer.save(user=request.user, dish=menu_item)
            menu_item.update_rating()
            return standardized_response(status.HTTP_201_CREATED, "Review added", serializer.data)
        return standardized_response(status.HTTP_400_BAD_REQUEST, "Invalid review", serializer.errors, success=False)

class OrderViewSet(viewsets.ModelViewSet):
    """
    PURPOSE: Manages order tracking and history.
    ROLE RESTRICTION: 
    - Customers: See only their own orders.
    - Staff/Admin: See ALL orders across the entire restaurant.
    API: GET /api/restaurant/orders/
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filters orders based on the user's role."""
        user = self.request.user
        if user.is_staff or getattr(user, 'role', '') in ['admin', 'employee']:
            return Order.objects.all().order_by('-created_at')
        return Order.objects.filter(user=user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """
        Handles the "Checkout" button click.
        WORKFLOW: 
        1. Validates the cart data (payload).
        2. Uses an 'atomic transaction' to ensure the whole order is saved or nothing is.
        3. Returns the FULL serialized order to the frontend.
        API: POST /api/restaurant/orders/
        """
        is_valid, error_msg = validate_order_payload(request.data)
        if not is_valid:
            return standardized_response(status.HTTP_400_BAD_REQUEST, error_msg, success=False)

        try:
            order = create_order_with_items(request.user, request.data)
            # Return full order details for the Success Modal
            serializer = self.get_serializer(order)
            return standardized_response(
                status.HTTP_201_CREATED, 
                "Order initiated successfully", 
                serializer.data
            )
        except Exception as e:
            logger.error(f"Order creation failed: {str(e)}")
            return standardized_response(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to create order", success=False)

    def list(self, request, *args, **kwargs):
        """Fetches orders and returns them in a standardized format with optional pagination."""
        queryset = self.get_queryset()
 
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            return standardized_response(status.HTTP_200_OK, "Orders retrieved", response.data)
 
        serializer = self.get_serializer(queryset, many=True)
        return standardized_response(status.HTTP_200_OK, "Orders retrieved", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Fetches a single order."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return standardized_response(status.HTTP_200_OK, "Order retrieved", serializer.data)

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """
        ROLE: Employee/Admin Only.
        PURPOSE: Moves an order to the next logical step.
        """
        user = request.user
        is_staff = user.is_authenticated and (user.is_staff or getattr(user, 'role', '') in ['admin', 'employee'])
        if not is_staff:
            return standardized_response(status.HTTP_403_FORBIDDEN, "Staff access required", success=False)

        order = self.get_object()
        status_flow = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
        try:
            current_idx = status_flow.index(order.status)
            if current_idx < len(status_flow) - 1:
                order.status = status_flow[current_idx + 1]
                order.save()
                return standardized_response(status.HTTP_200_OK, f"Order advanced to {order.status}")
            return standardized_response(status.HTTP_400_BAD_REQUEST, "Already delivered", success=False)
        except ValueError:
            return standardized_response(status.HTTP_400_BAD_REQUEST, "Cannot advance state", success=False)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Allows users to cancel 'pending' orders or staff to cancel any order."""
        order = self.get_object()
        is_staff = request.user.is_staff or getattr(request.user, 'role', '') in ['admin', 'employee']
        if order.status == 'pending' or is_staff:
            order.status = 'cancelled'
            order.save()
            return standardized_response(status.HTTP_200_OK, "Order cancelled")
        return standardized_response(status.HTTP_403_FORBIDDEN, "Cannot cancel this order", success=False)

class CarouselSlideViewSet(viewsets.ReadOnlyModelViewSet):
    """
    PURPOSE: Fetches active banners for the homepage.
    API: GET /api/restaurant/carousel/
    """
    queryset = CarouselSlide.objects.filter(is_active=True)
    serializer_class = CarouselSlideSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        """Fetches active banners for the homepage with optional pagination."""
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            return standardized_response(status.HTTP_200_OK, "Carousel slides retrieved", response.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return standardized_response(status.HTTP_200_OK, "Carousel slides retrieved", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Fetches a single carousel slide."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return standardized_response(status.HTTP_200_OK, "Carousel slide retrieved", serializer.data)

class CustomerCareViewSet(viewsets.ModelViewSet):
    """
    PURPOSE: Handles customer support messages.
    WORKFLOW: 
    - POST: Public (anyone can send a message).
    - GET/PATCH: Staff Only (viewing and resolving messages).
    """
    queryset = CustomerCareRequest.objects.all()
    serializer_class = CustomerCareSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        """Staff Only: View all incoming support messages with optional pagination."""
        user = self.request.user
        is_staff = user.is_authenticated and (user.is_staff or getattr(user, 'role', '') in ['admin', 'employee'])
        if not is_staff:
            return standardized_response(status.HTTP_403_FORBIDDEN, "Access denied", success=False)
            
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            return standardized_response(status.HTTP_200_OK, "Support requests retrieved", response.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return standardized_response(status.HTTP_200_OK, "Support requests retrieved", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Staff Only: View a single support message."""
        user = self.request.user
        is_staff = user.is_authenticated and (user.is_staff or getattr(user, 'role', '') in ['admin', 'employee'])
        if not is_staff:
            return standardized_response(status.HTTP_403_FORBIDDEN, "Access denied", success=False)
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return standardized_response(status.HTTP_200_OK, "Support request retrieved", serializer.data)
