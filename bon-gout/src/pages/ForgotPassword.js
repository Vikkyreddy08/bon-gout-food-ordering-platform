/**
 * FILE: bon-gout/src/pages/ForgotPassword.js
 * DESCRIPTION: 3-step password reset flow (email → OTP → new password).
 * PROJECT PART: Frontend (Page)
 * FLOW:
 *  - Step 1: User enters email address + clicks "Send OTP"
 *  - Step 2: User enters 6-digit OTP received via email + clicks "Verify & Continue"
 *  - Step 3: User sets new password (8+ chars, upper/lower/number/special) + submits reset
 */

import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaLock, FaCheckCircle, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OTPInput from '../components/OTPInput';

export default function ForgotPassword() {
  const { sendForgotPasswordOTP, verifyForgotPasswordOTP, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timer, setTimer] = useState(0);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Step 1: Send password reset OTP to email
  const handleSendResetOTP = async (e) => {
    if (e) e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      await sendForgotPasswordOTP(email);
      setTimer(30);
      setStep(2);
    } catch (_err) {
      // AuthContext shows the toast already
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify the 6-digit OTP, advance to Step 3
  const handleVerifyResetOTP = async (arg) => {
    if (arg && typeof arg.preventDefault === 'function') {
      arg.preventDefault();
    }
    if (otp.length < 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      await verifyForgotPasswordOTP(email, otp);
      setStep(3);
    } catch (_err) {
      // Toast shown by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Submit new password, return to login
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!isPasswordValid) {
      toast.error('Password must be 8+ characters with uppercase, lowercase, number, and special character.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      navigate('/login');
    } catch (_err) {
      // toast shown by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const isPasswordValid = passwordRegex.test(newPassword);

  const isSubmitDisabled = step === 3 && (
    newPassword !== confirmPassword ||
    !newPassword ||
    !isPasswordValid
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-orange-500 mb-2">Reset Password</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {step === 1 && "Enter your email to receive a password reset code"}
            {step === 2 && "Enter the 6-digit code sent to your email"}
            {step === 3 && "Set a new secure password for your account"}
          </p>
        </div>

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
                {num === 1 ? 'Email' : num === 2 ? 'Verify' : 'Reset'}
              </span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleSendResetOTP} className="space-y-6 animate-fade-in-up">
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyResetOTP} className="space-y-6 animate-fade-in-up">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Code sent to {email}
              </p>
            </div>
            <OTPInput
              length={6}
              onOTPChange={setOtp}
              onComplete={handleVerifyResetOTP}
            />
            <div className="flex flex-col gap-4">
              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify & Continue"}
              </button>
              <div className="flex justify-between items-center px-2">
                <button
                  type="button"
                  disabled={timer > 0 || isLoading}
                  onClick={handleSendResetOTP}
                  className={`text-sm font-bold transition-colors ${
                    timer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-orange-500 hover:text-orange-600'
                  }`}
                >
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                  }}
                  className="text-sm text-gray-500 hover:text-orange-500 font-medium transition-colors"
                >
                  Change Email
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5 animate-fade-in-up">
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
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

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-500 text-xs font-bold text-center">Passwords do not match!</p>
            )}

            <button
              type="submit"
              disabled={isLoading || isSubmitDisabled}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Remembered your password?{' '}
            <Link
              to="/login"
              className="text-orange-500 font-bold hover:underline"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
