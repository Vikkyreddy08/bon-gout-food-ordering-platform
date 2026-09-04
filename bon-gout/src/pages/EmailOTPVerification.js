
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import OTPInput from '../components/OTPInput';

export default function EmailOTPVerification() {
  const { verifyEmailOTP, sendEmailOTP, role: authRole, user: authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const interval = setInterval(() => setCooldown((c) => c - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [cooldown]);

  const handleVerify = async (arg) => {
    if (arg && typeof arg.preventDefault === 'function') {
      arg.preventDefault();
    }
    if (!otp || otp.length < 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const user = await verifyEmailOTP(email, otp);
      const finalUser = user || authUser || {};
      const userRole = finalUser.role || authRole || 'user';
      if (userRole === 'admin') navigate('/admin-dashboard');
      else if (userRole === 'employee') navigate('/orders');
      else navigate('/menu');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown}s before resending`);
      return;
    }
    setIsLoading(true);
    try {
      await sendEmailOTP(email);
      setCooldown(60);
      toast.success('OTP resent!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pt-24 pb-12 flex items-center justify-center transition-colors duration-300">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="text-6xl mb-8 mx-auto w-24 h-24 bg-white dark:bg-white/5 rounded-3xl flex items-center justify-center shadow-xl border border-gray-100 dark:border-white/10 transition-colors">
            ✉️
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4">
            Verify Email
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 font-medium transition-colors">
            Enter the 6-digit code sent to {email}
          </p>
        </div>

        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-4xl p-10 border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-none transition-colors">
          <div className="space-y-6">
            <OTPInput
              length={6}
              onOTPChange={(val) => setOtp(val)}
              onComplete={handleVerify}
            />

            <button
              type="button"
              onClick={handleVerify}
              disabled={isLoading || otp.length < 6}
              className="w-full py-4 rounded-2xl font-black text-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-black shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? 'Verifying...' : 'Verify & Sign In 🚀'}
            </button>

            <div className="text-center">
              {cooldown > 0 ? (
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Resend OTP in {cooldown}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-orange-500 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
