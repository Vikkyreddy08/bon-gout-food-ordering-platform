/**
 * FILE: bon-gout/src/pages/Login.js
 * DESCRIPTION: The entry point for all users (Customers, Staff, Admins).
 * PROJECT PART: Frontend (Page)
 * INTERACTIONS: 
 * - Communicates with 'AuthContext.js' to perform login/signup.
 * - Handles the "Secret Key" verification for Admin/Employee registration.
 * - Redirects users to different dashboards based on their role after login.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  // HOOKS:
  const { login, register } = useAuth();
  const navigate = useNavigate();
  
  // STATE:
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Signup modes.
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '',
    password: '',
    role: 'user', // Defaults to Customer (user).
    phone: '',
    access_code: '' // Required only for Admin/Employee signup.
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * PURPOSE: Processes the form submission.
   * WORKFLOW (Signup):
   * 1. Validate password strength.
   * 2. Call backend 'register' API.
   * 3. Switch to Login mode after success.
   * 
   * WORKFLOW (Login):
   * 1. Call backend 'login' API (returns JWT).
   * 2. Save tokens to LocalStorage (via AuthContext).
   * 3. Redirect to appropriate dashboard.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      toast.error('Please fill required fields');
      return;
    }

    // Strong Password Validation (only for signup)
    if (!isLogin) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        toast.error('Password must be 8+ characters with uppercase, lowercase, number, and special character.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const user = await login({ 
          username: formData.username, 
          password: formData.password,
          access_code: formData.access_code // Pass access_code for staff login
        });
        
        // ROLE-BASED REDIRECTION:
        // INTERVIEW NOTE: We redirect based on the 'role' field returned by the backend.
        if (user.role === 'admin') navigate('/admin-dashboard');
        else if (user.role === 'employee') navigate('/orders');
        else navigate('/menu');
      } else {
        await register({
            username: formData.username,
            email: formData.email || `${formData.username}@bon-gout.local`,
            password: formData.password,
            first_name: formData.username,
            role: formData.role,
            phone: formData.phone,
            access_code: formData.access_code
          });
        setIsLogin(true); // Switch to login mode after successful signup.
      }
    } catch (error) {
      // Errors are already handled by 'toast' inside AuthContext.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pt-24 pb-12 flex items-center justify-center transition-colors duration-300">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="text-6xl mb-8 mx-auto w-24 h-24 bg-white dark:bg-white/5 rounded-3xl flex items-center justify-center shadow-xl border border-gray-100 dark:border-white/10 transition-colors">
            {isLogin ? '🔓' : '✨'}
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4">
            {isLogin ? 'Welcome Back' : 'Join Bon Goût'}
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 font-medium transition-colors">
            {isLogin ? 'Sign in to continue your food journey' : 'Experience the finest taste in town'}
          </p>
        </div>

        {/* TOGGLE TABS */}
        <div className="flex p-1.5 bg-gray-200 dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 mb-10 transition-colors">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
              isLogin ? 'bg-orange-500 text-black shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/signup')}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
              !isLogin ? 'bg-orange-500 text-black shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-4xl p-10 border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-none transition-colors">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 transition-colors">Select Your Role</label>
                <div className="flex gap-4">
                  {['user', 'employee', 'admin'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r })}
                      className={`flex-1 py-3 rounded-2xl font-bold capitalize transition-all ${
                        formData.role === r 
                          ? 'bg-orange-500 text-black shadow-lg' 
                          : 'bg-white dark:bg-white/10 text-gray-500 border border-gray-200 dark:border-white/10'
                      }`}
                    >
                      {r === 'user' ? 'Customer' : r}
                    </button>
                  ))}
                </div>
              </div>

              {(formData.role === 'admin' || formData.role === 'employee') && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <label htmlFor="access_code" className="block text-sm font-bold text-orange-500 mb-2 transition-colors">
                    {formData.role === 'admin' ? 'Admin Access Code' : 'Employee Secret Key'}
                  </label>
                  <input
                    id="access_code"
                    type="password"
                    name="access_code"
                    value={formData.access_code}
                    onChange={handleChange}
                    required
                    className="w-full p-4 rounded-2xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/30 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors placeholder:text-gray-400"
                    placeholder={`Enter ${formData.role} code`}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 transition-colors">Username / Name</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full p-4 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors shadow-sm dark:shadow-none"
                placeholder="Enter username"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 transition-colors">Email</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-4 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors shadow-sm dark:shadow-none"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 transition-colors">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full p-4 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors shadow-sm dark:shadow-none"
                    placeholder="Enter 10-digit phone number"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 transition-colors">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-4 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors shadow-sm dark:shadow-none"
                placeholder="••••••••"
              />
              {!isLogin && (
                <p className="text-[10px] text-gray-500 mt-2 leading-tight transition-colors">
                  Must be 8+ characters, include uppercase, lowercase, a number, and a special character (@$!%*?&).
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl font-black text-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-black shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In 🚀' : 'Create Account ✨')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
