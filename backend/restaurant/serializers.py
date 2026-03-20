"""
FILE: backend/restaurant/serializers.py
DESCRIPTION: Converts restaurant data (Menu, Orders, Reviews) into JSON for the frontend.
PROJECT PART: Backend (Django REST Framework Serializers)
INTERACTIONS: 
- Used by 'restaurant/views.py' to format API responses.
- Transforms Python model objects into a format React can easily consume (JSON).
- Handles 'OrderItem' nesting within 'Order' objects.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import MenuItem, Category, Order, OrderItem, Review, CarouselSlide, CustomerCareRequest

User = get_user_model()

# =========================================
# CATEGORY SERIALIZER
# =========================================
class CategorySerializer(serializers.ModelSerializer):
    """
    PURPOSE: Converts Menu Categories (Starters, etc.) to JSON.
    LOGIC: SerializerMethodField handles the logic for choosing between local or remote images.
    """
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'

    def get_image(self, obj):
        """Returns the full URL for the category image."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url

# =========================================
# CUSTOMER CARE SERIALIZER
# =========================================
class CustomerCareSerializer(serializers.ModelSerializer):
    """
    PURPOSE: Handles support request data.
    """
    class Meta:
        model = CustomerCareRequest
        fields = '__all__'

# =========================================
# REVIEW SERIALIZER
# =========================================
class ReviewSerializer(serializers.ModelSerializer):
    """
    PURPOSE: Converts individual food reviews to JSON.
    """
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'username', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'dish']

# =========================================
# MENU ITEM SERIALIZER
# =========================================
class MenuItemSerializer(serializers.ModelSerializer):
    """
    PURPOSE: Converts individual dishes to JSON.
    LOGIC: Nests ReviewSerializer to show all reviews for each dish.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = MenuItem
        fields = '__all__'

    def get_image(self, obj):
        """Handles image URL logic for the dish."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url

# =========================================
# ORDER ITEM SERIALIZER
# =========================================
class OrderItemSerializer(serializers.ModelSerializer):
    """
    PURPOSE: Converts individual items within an order to JSON.
    """
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    menu_item_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name', 'menu_item_image', 'quantity', 'price']

    def get_menu_item_image(self, obj):
        """Fetches the image URL for the dish in the order."""
        if obj.menu_item:
            if obj.menu_item.image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.menu_item.image.url)
                return obj.menu_item.image.url
            return obj.menu_item.image_url
        return None

# =========================================
# ORDER SERIALIZER (READ)
# =========================================
class OrderSerializer(serializers.ModelSerializer):
    """
    PURPOSE: Converts a full Order (with all items) to JSON for the 'My Orders' page.
    LOGIC: Nests OrderItemSerializer to show exactly what was bought.
    """
    items = OrderItemSerializer(source='order_items', many=True, read_only=True)
    is_cash_on_delivery = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'total_amount', 'status', 'customer_name',
            'customer_email', 'customer_phone', 'customer_address', 'payment_method', 'payment_id',
            'is_cash_on_delivery', 'created_at', 'items'
        ]

    def get_is_cash_on_delivery(self, obj):
        return obj.payment_method == 'COD'

# =========================================
# CREATE ORDER SERIALIZER
# =========================================
from .services import create_order_with_items

class CreateOrderSerializer(serializers.ModelSerializer):
    """
    PURPOSE: Processes the 'Checkout' request from the cart.
    INPUTS: List of item IDs, quantities, and customer details.
    LOGIC: Delegates complex creation logic to the 'services.py' layer.
    """
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
        max_length=50,
        write_only=True
    )
    payment_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    customer_email = serializers.EmailField(required=False, allow_null=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'total_amount', 'customer_name', 
            'customer_email', 'customer_phone', 'customer_address', 'payment_method', 
            'items', 'payment_id'
        ]
        read_only_fields = ['id', 'order_number', 'total_amount']

    @transaction.atomic
    def create(self, validated_data):
        """Calls the specialized service to build the order and items atomically."""
        return create_order_with_items(self.context['request'].user, validated_data)


# =========================================
# CAROUSEL SLIDE SERIALIZER
# =========================================
class CarouselSlideSerializer(serializers.ModelSerializer):
    """
    PURPOSE: Converts landing page banner data to JSON.
    """
    image = serializers.SerializerMethodField()

    class Meta:
        model = CarouselSlide
        fields = '__all__'

    def get_image(self, obj):
        """Returns the banner image URL."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url
