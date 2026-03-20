/**
 * FILE: bon-gout/src/context/CartContext.js
 * DESCRIPTION: Manages the Shopping Cart state (adding/removing items, persistence) across the app.
 * PROJECT PART: Frontend (React Context)
 * INTERACTIONS: 
 * - Used by 'Menu.js' to add dishes to the cart.
 * - Used by 'Cart.js' to display and manage the final order.
 * - Persists cart data to 'localStorage' so items stay in the cart even if you refresh the page.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

// Create the Context - the global "cart container".
const CartContext = createContext();

/**
 * PURPOSE: Custom hook to easily manage the cart in any component.
 * USAGE: const { addToCart, cartCount } = useCart();
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

/**
 * PURPOSE: The Wrapper component that provides cart logic to the app.
 * STATE:
 * - cart: Array of objects [{ id, name, price, quantity }].
 */
export function CartProvider({ children }) {
  const { user, isLoggedIn } = useAuth();
  const [cart, setCart] = useState([]);

  /**
   * PURPOSE: Generates a unique key for storing the cart in the browser.
   * LOGIC: 
   * - If logged in: 'cart_user_123'
   * - If guest: 'cart_guest'
   * INTERVIEW NOTE: This prevents one user's cart from showing up for another user on the same computer.
   */
  const storageKey = useMemo(() => {
    return user?.id ? `cart_user_${user.id}` : 'cart_guest';
  }, [user]);

  /**
   * PURPOSE: Load saved cart from the browser memory on startup.
   */
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse cart:', error);
        setCart([]);
      }
    } else {
      setCart([]); // Clear if no saved cart for this key
    }
  }, [storageKey]);

  /**
   * PURPOSE: Save the cart to browser memory whenever it changes.
   */
  useEffect(() => {
    if (cart.length > 0 || localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    }
  }, [cart, storageKey]);

  /**
   * PURPOSE: Security/UX - clear cart when logging out.
   */
  useEffect(() => {
    if (!isLoggedIn) {
      setCart([]);
    }
  }, [isLoggedIn]);

  /**
   * PURPOSE: Calculates total quantity of items.
   * ANALOGY: Like counting how many boxes are in your physical shopping trolley.
   */
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  /**
   * PURPOSE: Adds a dish to the cart.
   * LOGIC: If item already exists, increase quantity. If new, add to array.
   */
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      let newCart;
      
      if (existing) {
        newCart = prev.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: (cartItem.quantity || 0) + 1 }
            : cartItem
        );
      } else {
        newCart = [...prev, { ...item, quantity: 1 }];
      }
      
      toast.success(`${item.name || 'Item'} added to cart! 🛒`);
      return newCart;
    });
  };

  /**
   * PURPOSE: Changes the quantity of an item (e.g. 1 -> 2).
   * LOGIC: If quantity becomes 0, remove the item entirely.
   */
  const updateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      setCart(prev => {
        toast.success('Item removed from cart');
        return prev.filter(item => item.id !== id);
      });
      return;
    }
    
    setCart(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity: newQty } : item
      )
    );
  };

  /**
   * PURPOSE: Removes a specific item from the cart.
   */
  const removeFromCart = (id) => {
    setCart(prev => {
      toast.success('Item removed from cart');
      return prev.filter(item => item.id !== id);
    });
  };

  /**
   * PURPOSE: Empties the entire cart.
   */
  const clearCart = (showToast = true) => {
    setCart([]);
    if (showToast) toast.success('Cart cleared!');
  };

  // Values exposed to the rest of the application.
  const value = {
    cart,
    cartCount,
    cartItems: cart, // Compatibility alias
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
