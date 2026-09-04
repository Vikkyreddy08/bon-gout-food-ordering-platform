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
      // LOGIC: Extract the standardized error message from our backend Response.
      const errorData = err.response?.data;
      let errorMsg = "Login failed";

      if (errorData?.message) {
        errorMsg = errorData.message;
      } else if (errorData) {
        const fieldErrors = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
          .join(" | ");
        errorMsg = fieldErrors || errorMsg;
      }
      
      toast.error(errorMsg);
      throw err;
    }
  };

  /**
   * PURPOSE: Creates a new account and auto-logs in the user.
   * API: POST /api/users/register/
   */
  const register = async (userData) => {
    try {
      const res = await api.post("users/register/", userData);
      const data = res.data.data || res.data;
      
      let registeredUser = null;
      
      if (data?.access && data?.refresh) {
        const { access, refresh } = data;
        setToken(access);
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        
        if (data?.user && typeof data.user === 'object') {
          registeredUser = data.user;
          setUser(registeredUser);
        } else {
          const userFields = {};
          ['id', 'username', 'email', 'first_name', 'role', 'phone', 'is_staff'].forEach((k) => {
            if (k in data) userFields[k] = data[k];
          });
          if (Object.keys(userFields).length > 0 && userFields.role) {
            registeredUser = userFields;
            setUser(registeredUser);
          } else {
            registeredUser = await fetchUserProfile();
          }
        }
        const displayName = registeredUser?.first_name || registeredUser?.username || userData?.username || "User";
        toast.success(`Welcome to Bon Goût, ${displayName}! ✨`);
        return registeredUser;
      } else {
        const loggedInUser = await login({
          username: userData?.email || userData?.username,
          password: userData?.password,
          access_code: userData?.access_code,
        });
        return loggedInUser;
      }
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = "Registration failed";

      if (errorData?.message) {
        errorMsg = errorData.message;
      } else if (errorData) {
        const fieldErrors = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
          .join(" | ");
        errorMsg = fieldErrors || errorMsg;
      }
      
      toast.error(errorMsg);
      throw err;
    }
  };

  /**
   * PURPOSE: Login with Google OAuth.
   * API: POST /api/users/google-login/
   */
  const googleLogin = async (idToken) => {
    try {
      const res = await api.post("users/google-login/", { id_token: idToken });
      const data = res.data.data || res.data;
      const { access, refresh, user } = data;

      setToken(access);
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      setUser(user);
      
      const displayName = user?.first_name || user?.username || "User";
      toast.success(`Welcome back, ${displayName}!`);
      return user;
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = "Google login failed";

      if (errorData?.message) {
        errorMsg = errorData.message;
      }
      
      toast.error(errorMsg);
      throw err;
    }
  };

  /**
   * Send Email OTP
   */
  const sendEmailOTP = async (email) => {
    try {
      const res = await api.post("users/send-email-otp/", { email });
      toast.success(res.data.message || "OTP sent!");
      return res.data;
    } catch (err) {
      const errorData = err.response?.data;
      toast.error(errorData?.message || "Failed to send OTP");
      throw err;
    }
  };

  /**
   * Verify Email OTP and login
   */
  const verifyEmailOTP = async (email, otp) => {
    try {
      const res = await api.post("users/verify-email-otp/", { email, otp });
      const data = res.data.data || res.data;
      const { access, refresh, user } = data;
      setToken(access);
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      setUser(user);
      const displayName = user?.first_name || user?.username || "User";
      toast.success(`Welcome back, ${displayName}!`);
      return user;
    } catch (err) {
      const errorData = err.response?.data;
      toast.error(errorData?.message || "OTP verification failed");
      throw err;
    }
  };

  /**
   * Send Phone OTP (Firebase) - just checks cooldown
   */
  const sendPhoneOTP = async (phone) => {
    try {
      const res = await api.post("users/send-phone-otp/", { phone });
      toast.success(res.data.message || "OTP sent!");
      return true;
    } catch (err) {
      const errorData = err.response?.data;
      toast.error(errorData?.message || "Failed to send OTP");
      throw err;
    }
  };

  /**
   * Verify Phone OTP via Firebase token
   */
  const verifyPhoneOTP = async (idToken, phone) => {
    try {
      const res = await api.post("users/verify-phone-otp/", { id_token: idToken, phone });
      const data = res.data.data || res.data;
      const { access, refresh, user } = data;
      setToken(access);
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      setUser(user);
      const displayName = user?.first_name || user?.username || "User";
      toast.success(`Welcome back, ${displayName}!`);
      return user;
    } catch (err) {
      const errorData = err.response?.data;
      toast.error(errorData?.message || "OTP verification failed");
      throw err;
    }
  };

  // Signup-specific verification functions (no login)
  const verifyEmailOTPForSignup = async (email, otp) => {
    try {
      await api.post("users/verify-email-otp-signup/", { email, otp });
      return true;
    } catch (err) {
      const errorData = err.response?.data;
      toast.error(errorData?.message || "OTP verification failed");
      throw err;
    }
  };

  const verifyPhoneOTPForSignup = async (idToken, phone) => {
    try {
      await api.post("users/verify-phone-otp-signup/", { id_token: idToken, phone });
      return true;
    } catch (err) {
      const errorData = err.response?.data;
      toast.error(errorData?.message || "OTP verification failed");
      throw err;
    }
  };

  const sendForgotPasswordOTP = async (email) => {
    try {
      const res = await api.post("users/send-password-reset-otp/", { email });
      toast.success(res.data.message || "If an account exists, a password reset OTP has been sent.");
      return true;
    } catch (err) {
      const errorData = err.response?.data;
      toast.error(errorData?.message || "Failed to send password reset OTP.");
      throw err;
    }
  };

  const verifyForgotPasswordOTP = async (email, otp) => {
    try {
      await api.post("users/verify-password-reset-otp/", { email, otp });
      toast.success("OTP verified! You can now set a new password.");
      return true;
    } catch (err) {
      const errorData = err.response?.data;
      toast.error(errorData?.message || "Invalid OTP. Please try again.");
      throw err;
    }
  };

  const resetPassword = async ({ email, otp, new_password, confirm_password }) => {
    try {
      const res = await api.post("users/reset-password/", { email, otp, new_password, confirm_password });
      toast.success(res.data.message || "Password reset successful! You can now log in.");
      return true;
    } catch (err) {
      const errorData = err.response?.data;
      toast.error(errorData?.message || "Failed to reset password. Please try again.");
      throw err;
    }
  };

  // Values exposed to the rest of the application.
  const value = {
    user,
    token,
    login,
    register,
    googleLogin,
    sendEmailOTP,
    verifyEmailOTP,
    sendPhoneOTP,
    verifyPhoneOTP,
    verifyEmailOTPForSignup,
    verifyPhoneOTPForSignup,
    sendForgotPasswordOTP,
    verifyForgotPasswordOTP,
    resetPassword,
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
