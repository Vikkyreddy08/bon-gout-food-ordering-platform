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
import threading
import hmac
import hashlib
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.db import transaction
from django.utils import timezone
from .models import Order, OrderItem, MenuItem
from rest_framework.exceptions import ValidationError

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

def send_order_invoice(order, subject=None):
    """
    PURPOSE: Sends a premium ticket-style order confirmation email (receipt)
    to the customer. Rendered from templates/email/order_invoice.html.

    TRIGGERS:
      - COD:    Immediately when the order is created (OrderViewSet.create).
      - ONLINE: After Razorpay signature verification succeeds
                (verify_razorpay_payment view).

    The email contains a Track button CTA. Its link is built from the
    FRONTEND_URL setting (defaults based on deployment target, can be
    overridden via env var).
    """
    try:
        customer_name = (order.customer_name or '').strip() or 'there'
        final_subject = subject or (
            f"🎉 {customer_name}, your Bon Gout order #{order.order_number} is confirmed!"
        )
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')

        context = {
            "order": order,
            "FRONTEND_URL": frontend_url,
        }

        html_content = render_to_string("email/order_invoice.html", context)
        # Minimal plain-text fallback for MUAs that strip HTML
        lines = [
            f"Thank you for ordering from Bon Gout!",
            f"Order # {order.order_number}",
            f"Total:  ₹{order.total_amount}",
            f"Date:   {timezone.localtime(order.created_at).strftime('%d %b %Y · %I:%M %p') if order.created_at else '-'}",
            f"Deliver to: {order.customer_address}",
            f"Payment method: {order.payment_method or 'COD'}",
            "",
            "Items:",
        ]
        try:
            for it in order.order_items.all():
                price = float(it.price)
                qty = int(it.quantity or 1)
                lines.append(f"  • {it.menu_item.name}  x{qty}  = ₹{price * qty:.2f}")
        except Exception:
            pass
        lines.append("")
        lines.append(f"Track your order: {frontend_url}/orders/{order.id}")
        text_content = "\n".join(lines)

        recipient = (order.customer_email or '').strip() or getattr(order.user, 'email', '')
        if not recipient:
            logger.warning(f"No email address available for order {order.order_number}")
            return False

        email = EmailMultiAlternatives(
            subject=final_subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
            reply_to=[settings.DEFAULT_FROM_EMAIL],
            headers={
                'X-Mailer': 'BonGout-Django',
                'X-Order-Number': order.order_number,
            },
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
        logger.info(f"Order invoice email sent for {order.order_number} -> {recipient[:4]}***")
        return True
    except Exception as e:
        logger.exception(f"Failed to send invoice email for order {getattr(order, 'order_number', '?')}: {str(e)}")
        return False

def send_order_invoice_async(order, subject=None):
    """Send the invoice outside the request so SMTP latency cannot block checkout."""
    threading.Thread(
        target=send_order_invoice,
        args=(order, subject),
        daemon=True,
    ).start()
