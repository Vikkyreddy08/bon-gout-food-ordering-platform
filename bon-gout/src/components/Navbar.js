/**
 * FILE: bon-gout/src/components/Navbar.js
 * DESCRIPTION: The global navigation bar that appears on every page.
 * PROJECT PART: Frontend (Shared Component)
 * INTERACTIONS: 
 * - Consumes 'AuthContext' to show/hide links based on user role.
 * - Consumes 'CartContext' to display the current item count.
 * - Consumes 'ThemeContext' to toggle between Light and Dark modes.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const navigate = useNavigate();
  // State to manage the mobile menu (hamburger menu) visibility.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Extracting global data from our contexts.
  const { user, isLoggedIn, logout, role, isAdmin, isEmployee } = useAuth();
  const { cartCount, clearCart } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();

  /**
   * PURPOSE: Displays the user's name or 'Guest'.
   */
  const getDisplayName = () => {
    if (!user) return 'Guest';
    return user.first_name || user.username;
  };

  /**
   * PURPOSE: Logs the user out and cleans up state.
   */
  const handleLogout = () => {
    logout();
    clearCart(false); // Empty the cart when logging out
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
      {/* DESKTOP MENU: Hidden on mobile, visible on medium screens and up */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link to="/" className="text-2xl font-black text-orange-500">🍽️ Bon Gout</Link>

        <div className="flex items-center space-x-8">
          {/* NAVIGATION LINKS: Conditional rendering based on ROLE */}
          <div className="flex space-x-6">
            <Link to="/menu" className="text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium">Menu</Link>
            <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium">About</Link>
            
            {/* ROLE-BASED LOGIC: Customers only see 'Customer Care' */}
            {!isAdmin && !isEmployee && (
              <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium">Customer Care</Link>
            )}
            
            {/* ROLE-BASED LOGIC: Logged-in Customers see their orders */}
            {isLoggedIn && !isAdmin && !isEmployee && (
              <Link to="/orders" className="text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium">My Orders</Link>
            )}
            
            {/* ROLE-BASED LOGIC: Staff see the shared dashboard */}
            {isEmployee && (
              <Link to="/orders" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-bold">📦 Staff Dashboard</Link>
            )}
            
            {/* ROLE-BASED LOGIC: Admins see full management tools */}
            {isAdmin && (
              <Link to="/admin-dashboard" className="text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-bold">🛡️ Admin Panel</Link>
            )}
            {isAdmin && (
              <Link to="/add-employee" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-bold">🧑‍🍳 Add Employee</Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* THEME TOGGLE: ☀️ for light, 🌙 for dark */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            {/* CART BUTTON: Only shown to customers */}
            {!isAdmin && !isEmployee && (
              <Link to="/cart" className="relative bg-orange-500/10 dark:bg-orange-500/20 px-4 py-2 rounded-2xl text-orange-600 dark:text-orange-300">
                🛒 Cart ({cartCount})
              </Link>
            )}

            {/* USER ACCOUNT ACTIONS */}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end">
                  <span className="text-gray-900 dark:text-white font-bold">👋 {getDisplayName()}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                    isAdmin ? 'bg-red-500 text-white' : 
                    isEmployee ? 'bg-blue-500 text-white' : 
                    'bg-green-500 text-white'
                  }`}>
                    {role}
                  </span>
                </div>
                <button onClick={handleLogout} className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="bg-orange-500 text-black px-6 py-2 rounded-2xl font-bold text-sm shadow-xl">
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE HEADER: Visible on small screens */}
      <div className="md:hidden px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-black text-orange-500">🍽️ Bon Gout</Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          {/* MOBILE MENU TOGGLE BUTTON */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="bg-gray-100 dark:bg-white/10 p-3 rounded-xl text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* MOBILE OVERLAY MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl p-6 space-y-6 border-t border-gray-200 dark:border-white/10 animate-fade-in-up">
          {user ? (
            <div className="flex items-center space-x-4 pb-4 border-b border-gray-200 dark:border-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-2xl font-black text-black">
                {getDisplayName()[0].toUpperCase()}
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">{getDisplayName()}</p>
                <p className="text-orange-500 text-xs font-black uppercase tracking-widest">{role}</p>
              </div>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="w-full bg-orange-500 text-black py-4 rounded-2xl font-black text-center block shadow-xl"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Login to Bon Gout 🍽️
            </Link>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {isAdmin && (
              <Link to="/admin-dashboard" className="bg-red-500/20 text-red-400 p-4 rounded-2xl text-center font-bold text-sm border border-red-500/30" onClick={() => setIsMobileMenuOpen(false)}>
                🛡️ Admin
              </Link>
            )}
            {isEmployee && (
              <Link to="/orders" className="bg-blue-500/20 text-blue-400 p-4 rounded-2xl text-center font-bold text-sm border border-blue-500/30" onClick={() => setIsMobileMenuOpen(false)}>
                📦 Staff
              </Link>
            )}
            {isAdmin && (
              <Link to="/add-employee" className="bg-blue-500/20 text-blue-400 p-4 rounded-2xl text-center font-bold text-sm border border-blue-500/30" onClick={() => setIsMobileMenuOpen(false)}>
                🧑‍🍳 Add Employee
              </Link>
            )}
            <Link to="/about" className="bg-white/5 text-gray-300 p-4 rounded-2xl text-center font-bold text-sm border border-white/10" onClick={() => setIsMobileMenuOpen(false)}>
              ℹ️ About
            </Link>
            {!isAdmin && !isEmployee && (
              <Link to="/contact" className="bg-white/5 text-gray-300 p-4 rounded-2xl text-center font-bold text-sm border border-white/10" onClick={() => setIsMobileMenuOpen(false)}>
                📞 Support
              </Link>
            )}
          </div>

          <button 
            onClick={handleLogout} 
            className="w-full bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white py-4 rounded-2xl font-bold transition-all duration-300 border border-white/10 hover:border-red-500/30"
          >
            Logout 👋
          </button>
        </div>
      )}
    </nav>
  );
}
