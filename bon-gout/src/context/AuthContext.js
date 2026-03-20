/**
 * FILE: bon-gout/src/context/AuthContext.js
 * DESCRIPTION: Manages global Authentication state (login, signup, user roles) across the React app.
 * PROJECT PART: Frontend (React Context)
 * INTERACTIONS: 
 * - Used by 'Navbar.js' to show/hide links based on login status.
 * - Used by 'Login.js' to perform the actual login/signup API calls.
 * - Provides user role data ('admin', 'employee', 'user') to protect routes.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from '../services/api';
import { jwtDecode } from "jwt-decode"; 

// Create the Context object - like a global "radio station" that components can tune into.
const AuthContext = createContext();

/**
 * PURPOSE: Custom hook to easily access auth data in any component.
 * USAGE: const { isLoggedIn, isAdmin } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * PURPOSE: The Wrapper component that provides auth data to the whole app.
 * STATE:
 * - user: Stores the logged-in user's profile (name, role, etc.).
 * - token: Stores the JWT access token for API calls.
 * - loading: Tracks if we are still checking the session on page refresh.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [loading, setLoading] = useState(true);

  /**
   * PURPOSE: Clears user data and tokens from memory and local storage.
   * ANALOGY: Like "logging out" of a computer and clearing the cache.
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  };

  /**
   * PURPOSE: Fetches the latest user profile from the backend.
   * API: GET /api/users/profile/
   * INTERVIEW NOTE: We call this after login to get the 'role' which is needed for RBAC.
   */
  const fetchUserProfile = async () => {
    try {
      const res = await api.get("users/profile/");
      const userData = res.data.data || res.data;
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      logout();
      return null;
    }
  };

  /**
   * PURPOSE: Runs once when the app starts.
   * LOGIC: If a token exists in local storage, check if it's expired. If valid, fetch the profile.
   */
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        try {
          const decoded = jwtDecode(storedToken);
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            logout(); // Token expired
          } else {
            setToken(storedToken);
            await fetchUserProfile();
          }
        } catch (error) {
          logout(); // Invalid token
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  /**
   * PURPOSE: Authenticates the user and saves tokens.
   * API: POST /api/users/login/
   */
  const login = async (credentials) => {
    try {
      const res = await api.post("users/login/", credentials);
      const { access, refresh } = res.data.data || res.data;
      
      setToken(access);
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      
      const profile = await fetchUserProfile();
      const displayName = profile?.first_name || profile?.username || "User";
      toast.success(`Welcome back, ${displayName}!`);
      return profile;
    } catch (err) {
      // LOGIC: Extract the most readable error message.
      const errorData = err.response?.data;
      const msg = errorData?.access_code || errorData?.detail || errorData?.message || "Invalid credentials";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
      throw err;
    }
  };

  /**
   * PURPOSE: Creates a new account.
   * API: POST /api/users/register/
   */
  const register = async (userData) => {
    try {
      await api.post("users/register/", userData);
      toast.success("Account created! Please login.");
    } catch (err) {
      // LOGIC: Extract errors for specific fields (username, access_code, etc.)
      const errorData = err.response?.data;
      let errorMsg = "Registration failed";
      
      if (errorData) {
        // If it's a validation error object, join the messages.
        const fieldErrors = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
          .join(" | ");
        errorMsg = fieldErrors || errorMsg;
      }
      
      toast.error(errorMsg);
      throw err;
    }
  };

  // Values exposed to the rest of the application.
  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isLoggedIn: !!token && !!user,
    role: user?.role || 'guest',
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    isUser: user?.role === 'user',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
