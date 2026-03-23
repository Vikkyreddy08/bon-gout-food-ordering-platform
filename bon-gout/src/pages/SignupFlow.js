/**
 * FILE: bon-gout/src/pages/SignupFlow.js
 * DESCRIPTION: A modern, multi-step signup process with Phone verification (OTP) and Password setup.
 * PROJECT PART: Frontend (Page)
 * REQUIREMENTS: 
 * - Step 1: Phone Number Input
 * - Step 2: OTP Verification
 * - Step 3: Password Creation with Toggle Visibility
 */

import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaPhone, FaLock, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SignupFlow = () => {
  const { register, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  // FLOW STATE: 1 = Phone, 2 = OTP, 3 = Password
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // FORM DATA STATE
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6-digit OTP
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [timer, setTimer] = useState(0); // 30s resend timer

  // TIMER LOGIC
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // ==========================================
  // STEP 1: SEND OTP
  // ==========================================
  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post('users/send-otp/', { phone });
      toast.success("OTP sent to your phone!");
      setTimer(30);
      setStep(2);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to send OTP. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // STEP 2: VERIFY OTP
  // ==========================================
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post('users/verify-otp/', { phone, otp: fullOtp });
      toast.success("Phone verified successfully! ✨");
      setStep(3);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Invalid OTP. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // OTP INPUT HANDLERS
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-focus next
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleBackspace = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  // UI VISIBILITY STATE
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ==========================================
  // STEP 3: FINAL SIGNUP
  // ==========================================
  const handleFinalSignup = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');

    // Validations
    if (!username) {
      toast.error("Please choose a username.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error('Password must be 8+ characters with uppercase, lowercase, number, and special character.');
      return;
    }

    setIsLoading(true);
    try {
      // Calling the real registration service from AuthContext
      const response = await api.post('users/register/', {
        username,
        phone,
        otp: fullOtp, // Send OTP again for backend verification during registration
        password,
        role: 'user',
        email: `${username}@bon-gout.local`
      });
      
      const { access, refresh } = response.data.data;
      
      // Auto-login after successful signup
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      
      toast.success("Registration successful! Welcome to Bon Goût ✨");
      
      // Force page reload or redirect to dashboard
      window.location.href = '/menu';
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Registration failed. Please check your details.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const isSubmitDisabled = step === 3 && (password !== confirmPassword || !password || !username);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-orange-500 mb-2">Create Account</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {step === 1 && "Start with your phone number"}
            {step === 2 && "Enter the 6-digit code"}
            {step === 3 && "Set your secure password"}
          </p>
        </div>

        {/* PROGRESS INDICATOR */}
        <div className="flex justify-between mb-10 px-4">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= num ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
              }`}>
                {step > num ? <FaCheckCircle /> : num}
              </div>
              <span className={`text-[10px] mt-2 font-bold uppercase tracking-widest ${
                step >= num ? 'text-orange-500' : 'text-gray-400'
              }`}>
                {num === 1 ? 'Phone' : num === 2 ? 'Verify' : 'Finalize'}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 1: PHONE INPUT */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-6 animate-fade-in-up">
            <div className="relative">
              <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* STEP 2: OTP INPUT */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-6 animate-fade-in-up">
            <div className="text-center">
              <p className="text-xs text-orange-500 font-bold mb-4 bg-orange-500/10 py-2 rounded-lg animate-pulse">
                For testing, use code: 123456
              </p>
            </div>
            <div className="flex justify-center gap-2">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  className="w-10 h-12 text-center text-xl font-bold rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  value={data}
                  onChange={(e) => handleOtpChange(e.target, index)}
                  onKeyDown={(e) => handleBackspace(e, index)}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify & Continue"}
              </button>
              <div className="flex justify-between items-center px-2">
                <button
                  type="button"
                  disabled={timer > 0 || isLoading}
                  onClick={handleSendOTP}
                  className={`text-sm font-bold transition-colors ${
                    timer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-orange-500 hover:text-orange-600'
                  }`}
                >
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-500 hover:text-orange-500 font-medium transition-colors"
                >
                  Change Number
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 3: PASSWORD SETUP */}
        {step === 3 && (
          <form onSubmit={handleFinalSignup} className="space-y-5 animate-fade-in-up">
            {/* Username Field */}
            <div className="relative">
              <input
                type="text"
                placeholder="Choose Username"
                className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-xs font-bold text-center">Passwords do not match!</p>
            )}

            <button
              type="submit"
              disabled={isLoading || isSubmitDisabled}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Finish Signup"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')}
              className="text-orange-500 font-bold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupFlow;
