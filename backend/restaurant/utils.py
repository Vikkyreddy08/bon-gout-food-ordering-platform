"""
FILE: backend/restaurant/utils.py
DESCRIPTION: This file contains helper functions used throughout the backend to maintain consistency.
PROJECT PART: Backend (Utility Layer)
INTERACTIONS: 
- 'standardized_response' is used by almost every View to ensure React always receives the same JSON structure.
- 'validate_order_payload' is used by 'restaurant/views.py' before saving a new order.
"""

from rest_framework.response import Response
from rest_framework import status
from .models import MenuItem

def standardized_response(status_code, message, data=None, success=True):
    """
    PURPOSE: Wraps every API response in a consistent format.
    
    REAL-WORLD ANALOGY: Like a standard "Receipt" format used by every waiter in a restaurant. 
    It doesn't matter who serves you; the receipt always looks the same.
    
    FORMAT:
    - status: "success" or "error"
    - message: A human-readable description of what happened.
    - data: The actual content (e.g., list of food items, order details).
    
    INTERVIEW NOTE: Using a standardized response makes the frontend much easier to build, 
    as developers always know where to find the 'message' or 'data' in the JSON.
    """
    return Response({
        "status": "success" if success else "error",
        "message": message,
        "data": data
    }, status=status_code)

def validate_order_payload(data):
    """
    PURPOSE: Security and Data Integrity check for new orders.
    
    LOGIC: 
    - Ensures the 'items' list isn't empty.
    - Verifies that every dish ID exists and is currently 'available' (not sold out).
    - Checks that quantities are positive numbers.
    
    INPUT: 'data' is the raw JSON sent from the React cart.
    OUTPUT: (True, None) if valid, or (False, "Error Message") if invalid.
    """
    items = data.get('items', [])
    if not items:
        return False, "Order items are required"
    
    for item in items:
        # Check both 'id' and 'menu_item_id' for frontend flexibility
        item_id = item.get('id') or item.get('menu_item_id')
        qty = item.get('quantity', 0)
        
        if not item_id:
            return False, "Each item must have an id"
        
        if not isinstance(qty, int) or qty <= 0:
            return False, f"Invalid quantity for item {item_id}"
        
        if not MenuItem.objects.filter(id=item_id, available=True).exists():
            return False, f"Menu item with ID {item_id} is unavailable or does not exist"
            
    return True, None
