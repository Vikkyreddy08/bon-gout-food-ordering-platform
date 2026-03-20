/**
 * FILE: bon-gout/src/components/BottomNav.js
 * DESCRIPTION: A sticky bottom navigation bar for mobile users.
 * PROJECT PART: Frontend (Component)
 * INTERACTIONS: 
 * - Only visible on small screens (md:hidden).
 * - Provides quick access to Home, Menu, Cart, and Orders.
 * - Displays a live 'Cart Count' badge from 'CartContext'.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function BottomNav() {
  const location = useLocation();
  const { cartCount } = useCart(); // Get current number of items in the cart.

  // Define the icons and paths for the bottom bar.
  const navItems = [
    { label: 'Home', path: '/', icon: '🏠' },
    { label: 'Menu', path: '/menu', icon: '🍽️' },
    { label: 'Cart', path: '/cart', icon: '🛒', badge: cartCount },
    { label: 'Orders', path: '/orders', icon: '📋' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-t border-white/10 px-6 py-3">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center space-y-1 transition-all duration-300 ${
                isActive ? 'text-orange-500 scale-110' : 'text-gray-400'
              }`}
            >
              <div className="relative text-2xl">
                {item.icon}
                {/* 
                    BADGE LOGIC: 
                    If items are in the cart, show a red circle with the number. 
                */}
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-black">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
