/**
 * FILE: bon-gout/src/services/api.js
 * DESCRIPTION: Centralized Axios instance for all backend communication.
 * PROJECT PART: Frontend (Services)
 * INTERACTIONS: 
 * - Used by every page and context to talk to the Django backend.
 * - Automatically handles JWT token attachment and token refreshing.
 */

import axios from 'axios';

// Create a pre-configured instance of Axios.
// We clean the URL to ensure it starts with https:// and ends with /api/
const getBaseURL = () => {
  let url = process.env.REACT_APP_API_URL || 'https://foodordering-n21r.onrender.com/api/';
  
  // 1. Ensure it starts with http:// or https://
  if (url && !url.startsWith('http')) {
    url = `https://${url}`;
  }
  
  // 2. Ensure it ends with /api/
  if (url && !url.endsWith('/api/')) {
    if (url.endsWith('/api')) {
      url = `${url}/`;
    } else {
      url = url.endsWith('/') ? `${url}api/` : `${url}/api/`;
    }
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseURL()
});

// DEBUG: Log the base URL to help troubleshoot deployment connectivity.
if (process.env.NODE_ENV === 'production') {
  console.log("🚀 API Base URL:", api.defaults.baseURL);
}

// The endpoint for getting a new access token using a refresh token.
const REFRESH_URL = "users/token/refresh/"; // ✅ Matches backend users/urls.py

/**
 * INTERCEPTOR: RESPONSE
 * PURPOSE: Handles errors globally, specifically 401 Unauthorized (Expired Tokens).
 * LOGIC: 
 * 1. If an API call fails with 401, try to use the 'refresh_token'.
 * 2. If refresh succeeds, retry the original failed request with the new token.
 * 3. If refresh fails, log the user out and redirect to login.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // DEBUG: Log API errors in production to help identify connectivity or data issues.
    if (process.env.NODE_ENV === 'production') {
      console.error("❌ API Error:", {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data
      });
    }

    const originalRequest = error.config;
    // Check if the error is 401 and we haven't already tried to retry.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          // Attempt to get a new access token.
          const res = await axios.post(`${api.defaults.baseURL}${REFRESH_URL}`, { refresh: refreshToken });
          const newAccessToken = res.data.access;
          
          // Save the new token.
          localStorage.setItem("access_token", newAccessToken);
          
          // Update the headers for future calls AND the current retrying call.
          api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          // Retrying the original failed request!
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, the user session is truly dead.
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * INTERCEPTOR: REQUEST
 * PURPOSE: Automatically attaches the JWT 'Bearer' token to every outgoing request.
 * LOGIC: Checks 'localStorage' for a token before sending the request.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

