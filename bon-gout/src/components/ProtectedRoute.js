/**
 * FILE: bon-gout/src/components/ProtectedRoute.js
 * DESCRIPTION: A "Guard" component that protects private pages from unauthorized access.
 * PROJECT PART: Frontend (Security Wrapper)
 * INTERACTIONS: 
 * - Wraps sensitive pages like 'AdminDashboard' or 'Orders'.
 * - Consumes 'AuthContext' to check for a valid JWT token and correct role.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import Loader from './Loader';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { token, user, loading } = useAuth();
  
  /**
   * 1. LOADING STATE:
   * If we are still checking the session (e.g., on refresh), show the loader 
   * instead of accidentally redirecting the user to Login.
   */
  if (loading) return <Loader />;
  
  /**
   * 2. AUTHENTICATION CHECK:
   * If there is no token, the user isn't logged in.
   * Redirect them to the Login page.
   */
  if (!token) {
    toast.error('Please login to access this page 🔐');
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }
  
  /**
   * 3. ROLE-BASED AUTHORIZATION:
   * Even if logged in, does the user have the right "Level"?
   * Example: A Customer ('user') trying to access the Admin Panel.
   * 
   * INTERVIEW NOTE: This is our final layer of frontend security. 
   * It ensures that even if someone knows the URL, they can't see the content 
   * without the correct role.
   */
  if (roles.length && !roles.includes(user?.role)) {
    toast.error('Access denied. Insufficient permissions.');
    return <Navigate to="/" replace />; // Send them back home.
  }
  
  // If all checks pass, show the actual page (children).
  return children;
};

export default ProtectedRoute;
