"""
FILE: backend/restaurant/models.py
DESCRIPTION: Defines the core data structure for the restaurant app (Menu, Orders, Reviews, etc.).
PROJECT PART: Backend (Django Models)
INTERACTIONS: 
- Basis for 'restaurant/serializers.py' to format data for the frontend.
- 'OrderItem' uses a Signal to automatically update the 'Order' total_amount.
- Linked to 'users/models.py' via ForeignKey relationships.
"""

from django.db import models
from django.core.validators import MinValueValidator
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from django.conf import settings
import uuid

# ==========================================
# RESTAURANT MODEL
# ==========================================
class Restaurant(models.Model):
    """
    PURPOSE: Stores global information about the restaurant.
    """
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# ==========================================
# CATEGORY MODEL
# ==========================================
class Category(models.Model):
    """
    PURPOSE: Organizes menu items into groups (e.g., Starters, Main Course, Drinks).
    REAL-WORLD MEANING: Like the sections in a physical paper menu.
    """
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)  # Support file uploads
    image_url = models.URLField(blank=True, null=True)  # Support remote URLs

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

# ==========================================
# MENU ITEM MODEL
# ==========================================
class MenuItem(models.Model):
    """
    PURPOSE: Stores details for every dish or drink offered by the restaurant.
    REAL-WORLD MEANING: A specific item a customer can buy (e.g., "Chicken Biryani").
    """
    name = models.CharField(max_length=255)
    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    restaurant = models.ForeignKey('Restaurant', on_delete=models.CASCADE, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='menu_items/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)  # Highlights items on the homepage carousel or list
    is_veg = models.BooleanField(default=False)
    is_spicy = models.BooleanField(default=False)
    prep_time = models.CharField(max_length=20, blank=True)  # e.g., "25min"
    
    # Rating Fields: Aggregated from the Review model
    average_rating = models.FloatField(default=0.0)
    total_reviews = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def update_rating(self):
        """
        PURPOSE: Re-calculates the average rating whenever a new review is added.
        LOGIC: sum of all ratings / count of reviews.
        """
        reviews = self.reviews.all()
        if reviews.exists():
            self.total_reviews = reviews.count()
            self.average_rating = round(sum(r.rating for r in reviews) / self.total_reviews, 1)
        else:
            self.total_reviews = 0
            self.average_rating = 0.0
        self.save()

    def __str__(self):
        return self.name

# ==========================================
# REVIEW MODEL
# ==========================================
class Review(models.Model):
    """
    PURPOSE: Allows customers to give feedback on specific dishes.
    ROLE RESTRICTION: Usually created by 'user' role after trying a dish.
    """
    dish = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['dish', 'user']  # Ensures a user can only review a dish once.
        ordering = ['-created_at']

    def __str__(self):
        return f"Review for {self.dish.name} by {self.user.username}"

# ==========================================
# ORDER MODEL
# ==========================================
class Order(models.Model):
    """
    PURPOSE: Represents a customer's purchase transaction.
    REAL-WORLD MEANING: The "Bill" or "Ticket" that goes to the kitchen and the customer.
    
    WORKFLOW:
    1. User creates order (status: 'pending').
    2. Admin/Employee confirms (status: 'confirmed').
    3. Kitchen prepares (status: 'preparing').
    4. Delivery staff delivers (status: 'delivered').
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_CHOICES = [
        ('COD', 'Cash on Delivery'),
        ('ONLINE', 'Online Payment'),
        ('UPI', 'UPI'),
        ('CARD', 'Card'),
        ('NET_BANKING', 'Net Banking'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders"
    )

    order_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    # Customer Details: Stored per order in case user info changes later.
    customer_name = models.CharField(max_length=100)
    customer_email = models.EmailField(blank=True, null=True)
    customer_phone = models.CharField(max_length=20)
    customer_address = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES,
        default='COD'
    )

    payment_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Transaction ID from Razorpay or other gateways."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.order_number}"

    def get_total_items(self):
        """Helper to count total items in the order."""
        return sum(item.quantity for item in self.order_items.all())

# ==========================================
# ORDER ITEM MODEL
# ==========================================
class OrderItem(models.Model):
    """
    PURPOSE: Links specific MenuItems to an Order with quantity and snapshot price.
    REAL-WORLD MEANING: One line item on a receipt (e.g., "2x Biryani @ 250 each").
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='order_items'
    )
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price at time of purchase.")

    class Meta:
        unique_together = ['order', 'menu_item']

    def get_total_price(self):
        """Calculates total for this specific item line."""
        return self.quantity * self.price

    def __str__(self):
        return f"{self.menu_item.name} x {self.quantity}"

# ==========================================
# SIGNALS
# ==========================================
@receiver(post_save, sender=OrderItem)
@receiver(post_delete, sender=OrderItem)
def update_order_total(sender, instance, **kwargs):
    """
    PURPOSE: Automatically updates the parent Order's total_amount.
    LOGIC: Whenever an OrderItem is saved or deleted, recalculate the sum of all items.
    """
    order = instance.order
    total = sum(item.get_total_price() for item in order.order_items.all())
    order.total_amount = total
    order.save(update_fields=['total_amount', 'updated_at'])

# ==========================================
# CAROUSEL SLIDE MODEL
# ==========================================
class CarouselSlide(models.Model):
    """
    PURPOSE: Dynamic landing page carousel content.
    REAL-WORLD MEANING: The big sliding banners you see on the homepage.
    """
    title = models.CharField(max_length=255, help_text="Main quote text")
    subtitle = models.CharField(max_length=255, blank=True, help_text="Sub-quote text")
    image = models.ImageField(upload_to='carousel/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True, help_text="Remote image URL")
    order = models.PositiveIntegerField(default=0, help_text="Display order (0 first)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title

# ==========================================
# CUSTOMER CARE MODEL
# ==========================================
class CustomerCareRequest(models.Model):
    """
    PURPOSE: Stores messages from the "Contact Us" form.
    WORKFLOW: User submits form -> Entry created -> Admin/Employee sees it in dashboard -> Marks as resolved.
    """
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Request from {self.name} - {self.phone}"
