/**
 * FILE: bon-gout/src/App.js
 * DESCRIPTION: The main entry point and "Skeleton" of the React application.
 * PROJECT PART: Frontend (Core)
 * INTERACTIONS: 
 * - Defines all URL routes (e.g., /menu, /cart, /admin-dashboard).
 * - Wraps the entire app in 'Context Providers' (Auth, Cart, Theme).
 * - Manages global UI elements like the 'Navbar', 'BottomNav', and 'Toaster'.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import About from './pages/About';
import Contact from './pages/Contact';
import Orders from './pages/Orders';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AddEmployee from './pages/AddEmployee';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

/**
 * COMPONENT: AppContent
 * PURPOSE: Contains the actual page routing and shared UI.
 * LOGIC: Must be a separate component so it can consume 'useTheme' from the ThemeProvider.
 */
function AppContent() {
  const { isDarkMode } = useTheme();
  
  return (
    <Router>
      {/* SHARED UI: Navbar is visible on all pages. */}
      <Navbar />
      
      {/* 
          ROUTING: Determines which 'Page' to show based on the URL. 
          ANALOGY: Like a GPS directing you to different rooms in a building.
      */}
      <main className="pt-16 pb-20 md:pb-0 transition-colors duration-300">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/orders" element={
            <ProtectedRoute roles={['user', 'employee', 'admin']}>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-dashboard" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/add-employee" element={
            <ProtectedRoute roles={['admin']}>
              <AddEmployee />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      {/* MOBILE UI: A sticky bottom bar for phones. */}
      <BottomNav />

      {/* NOTIFICATIONS: Displays success/error popups. */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: isDarkMode ? '#1f2937' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#1f2937',
            borderRadius: '1rem',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
            fontWeight: 'bold',
          },
        }}
      />
    </Router>
  );
}

/**
 * COMPONENT: App
 * PURPOSE: The absolute root.
 * LOGIC: Wraps everything in 'Context Providers' to ensure global state (Auth, Cart, Theme) 
 * is available to EVERY component in the project.
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
