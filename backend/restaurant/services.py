"""
FILE: backend/restaurant/services.py
DESCRIPTION: This file contains complex "Business Logic" that doesn't belong in models or views.
PROJECT PART: Backend (Service Layer)
INTERACTIONS: 
- Called by 'restaurant/views.py' to handle order creation and payment verification.
- Uses 'restaurant/models.py' to save and update data.
- Integrates with external APIs like Razorpay for online payments.
"""

import razorpay
import logging
import hmac
import hashlib
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.db import transaction
from .models import Order, OrderItem, MenuItem
from rest_framework.exceptions import ValidationError

from django.utils import timezone
import random
import string

logger = logging.getLogger(__name__)

# Initialize Razorpay Client using credentials from settings.py (.env file)
razorpay_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)

def generate_order_number():
    """
    PURPOSE: Generates a professional, unique ID for every order.
    FORMAT: BNG-YYYYMMDD-XXXX (e.g., BNG-20240316-A1B2)
    
    ANALOGY: Like a receipt number at a real restaurant.
    """
    date_str = timezone.now().strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"BNG-{date_str}-{random_str}"

@transaction.atomic
def create_order_with_items(user, data):
    """
    PURPOSE: High-level logic to build a complete order from a shopping cart.
    
    LOGIC: 
    - Uses '@transaction.atomic' to ensure either EVERYTHING is saved or NOTHING is. 
      (Prevents "ghost orders" where the order exists but the food items are missing).
    - Merges duplicate item IDs (if a user clicks 'Add' twice for the same dish).
    
    INPUTS: 
    - user: The logged-in User object.
    - data: Dictionary containing customer details and the list of items.
    
    OUTPUT: The newly created Order object.
    """
    customer_name = data.get('customer_name')
    customer_email = data.get('customer_email')
    customer_phone = data.get('customer_phone')
    customer_address = data.get('customer_address')
    payment_method = data.get('payment_method', 'COD')
    items_data = data.get('items', [])
    
    # 1. MERGE DUPLICATES: 
    # Loops through the cart like checking off items on a shopping list.
    merged_items = {}
    for item in items_data:
        m_id = item.get('id') or item.get('menu_item_id')
        qty = int(item.get('quantity', 1))
        if m_id:
            merged_items[m_id] = merged_items.get(m_id, 0) + qty

    if not merged_items:
        raise ValidationError("No valid items provided in the order.")

    # 2. VALIDATE & CALCULATE TOTAL:
    total_amount = 0
    items_to_create = []
    
    for m_id, qty in merged_items.items():
        try:
            # Check if the dish actually exists and is not sold out.
            menu_item = MenuItem.objects.get(id=m_id, available=True)
            total_amount += menu_item.price * qty
            
            # Create a "draft" of the OrderItem line.
            items_to_create.append(OrderItem(
                menu_item=menu_item,
                quantity=qty,
                price=menu_item.price # Snapshot the price at time of purchase!
            ))
        except MenuItem.DoesNotExist:
            raise ValidationError(f"Menu item with ID {m_id} is unavailable.")
        
    # 3. CREATE THE ORDER:
    order = Order.objects.create(
        user=user,
        order_number=generate_order_number(),
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        customer_address=customer_address,
        payment_method=payment_method,
        total_amount=total_amount,
        status='pending'
    )
    
    # 4. LINK ITEMS & BULK SAVE:
    # Attaches each dish to the specific order we just created.
    for item in items_to_create:
        item.order = order
    
    # bulk_create is much faster than saving items one-by-one!
    OrderItem.objects.bulk_create(items_to_create)
    return order

def create_razorpay_order_api(amount_in_inr):
    """
    PURPOSE: Communicates with Razorpay to initiate a secure transaction.
    
    LOGIC: Razorpay expects currency in "Paise" (1 INR = 100 Paise).
    
    INPUT: Amount in Rupees (e.g., 250.50).
    OUTPUT: A Razorpay order object with a unique 'id'.
    """
    try:
        # Conversion: 250.50 INR -> 25050 Paise
        amount_paise = int(float(amount_in_inr) * 100)
        
        data = {
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": "1" # Automatically capture payment after success
        }
        
        # Call the external Razorpay API
        razor_order = razorpay_client.order.create(data=data)
        return razor_order
    except Exception as e:
        logger.error(f"Razorpay order creation error: {str(e)}")
        raise ValidationError(f"Could not initiate payment: {str(e)}")

def verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """
    PURPOSE: Security check to ensure the payment success message is authentic.
    
    LOGIC: Uses HMAC-SHA256 hashing to verify that the 'signature' was indeed 
    generated by Razorpay using our private secret key.
    
    ANALOGY: Like verifying the "hologram" or "watermark" on a physical banknote.
    
    INTERVIEW NOTE: This prevents "Payment Spoofing" where a hacker might try to 
    manually call our API to mark an order as 'paid' without actually paying.
    """
    params_dict = {
        'razorpay_order_id': razorpay_order_id,
        'razorpay_payment_id': razorpay_payment_id,
        'razorpay_signature': razorpay_signature
    }
    
    try:
        razorpay_client.utility.verify_payment_signature(params_dict)
        return True
    except Exception as e:
        logger.error(f"Signature verification failed (HMAC mismatch): {str(e)}")
        return False

def send_order_invoice(order):
    """
    PURPOSE: Sends a professional email receipt to the customer.
    
    LOGIC: 
    - Generates a beautiful HTML email from a template.
    - Also includes a Plain Text version for old email apps.
    
    ANALOGY: The digital version of a printed receipt handed to a diner.
    """
    try:
        subject = f"Order Confirmation - Bon Gout #{order.order_number}"
        context = {"order": order}
        
        # Load the beautiful HTML design
        html_content = render_to_string("email/order_invoice.html", context)
        # Create a text-only version (fallback)
        text_content = strip_tags(html_content)
        
        # Find where to send it
        recipient = order.customer_email or order.user.email
        if not recipient:
            logger.warning(f"No email found for order {order.order_number}")
            return False

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        return True
    except Exception as e:
        logger.error(f"Failed to send invoice email: {str(e)}")
        return False
