/**
 * FILE: bon-gout/src/pages/AddEmployee.js
 * DESCRIPTION: An Admin-only portal to create new staff accounts.
 * PROJECT PART: Frontend (Page)
 * INTERACTIONS: 
 * - Only accessible to 'admin' role.
 * - Sends data to 'users/add-employee/' API.
 * - Automatically forces the role to 'employee' on the backend.
 */

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export default function AddEmployee() {
  // STATE: Stores form inputs for the new employee.
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '',
    password: '',
    first_name: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * PURPOSE: Submits the new employee data to the server.
   * SECURITY: 
   * 1. Frontend: Checks if user is Admin before rendering.
   * 2. Backend: Verifies Admin JWT before creating the user.
   * 3. Password: Enforces strict security standards.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      toast.error('Username and Password are required');
      return;
    }

    // Strong Password Regex: 8+ chars, 1 Upper, 1 Lower, 1 Number, 1 Special.
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error('Password must be 8+ chars with uppercase, lowercase, number, and special char.');
      return;
    }

    setIsLoading(true);
    try {
      // API: POST /api/users/add-employee/
      const response = await api.post('users/add-employee/', formData);
      toast.success(response.data.message || 'Employee account created! 🛡️');
      
      // Clear form on success
      setFormData({ 
        username: '', 
        email: '',
        password: '',
        first_name: '',
        phone: ''
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create employee';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white pt-24 pb-12 flex items-center justify-center transition-colors duration-300">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-12">
          <div className="text-6xl mb-8 mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-500/10 rounded-3xl flex items-center justify-center shadow-lg dark:shadow-none transition-colors">
            🧑‍🍳
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent mb-4">
            Add Employee
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 transition-colors">
            Create a new staff account
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl rounded-4xl p-10 border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-none transition-colors">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 transition-colors">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full p-4 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm dark:shadow-none"
                placeholder="employee_username"
              />
            </div>

            <div>
              <label htmlFor="first_name" className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 transition-colors">Full Name</label>
              <input
                id="first_name"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full p-4 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm dark:shadow-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 transition-colors">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-4 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm dark:shadow-none"
                placeholder="staff@bon-gout.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 transition-colors">Phone</label>
              <input
                id="phone"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-4 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm dark:shadow-none"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 transition-colors">Initial Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-4 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm dark:shadow-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl font-black text-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Staff Account 🚀'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
