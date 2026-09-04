
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import OTPInput from '../components/OTPInput';
import { auth } from '../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

export default function PhoneOTPVerification() {
  const { verifyPhoneOTP, sendPhoneOTP, role: authRole, user: authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verificationId, setVerificationId] = useState(null);
  const phone = location.state?.phone;
  const recaptchaRef = useRef(null);
  const [firebaseReady, setFirebaseReady] = useState(false);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!phone) {
      navigate('/login');
      return;
    }
    if (!auth) {
      setFirebaseReady(false);
    } else {
      setFirebaseReady(true);
    }

    return () => {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch (err) {
          console.warn('Error clearing recaptcha:', err);
        }
      }
    };
  }, [phone, navigate, auth]);

  useEffect(() => {
    if (firebaseReady && auth && phone && !initializedRef.current && !verificationId) {
      const timer = setTimeout(() => {
        initFirebasePhoneAuth();
        initializedRef.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [firebaseReady, auth, phone, verificationId]);

  useEffect(() => {
    if (cooldown > 0) {
      const interval = setInterval(() => setCooldown((c) => c - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [cooldown]);

  const initFirebasePhoneAuth = async () => {
    if (!auth) return;
    try {
      await sendPhoneOTP(phone);

      const container = document.getElementById('recaptcha-container');
      if (!container) {
        throw new Error("Recaptcha container not found!");
      }

      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch (err) {
          console.warn('Error clearing existing recaptcha:', err);
        }
      }

      const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 
        size: 'invisible',
        callback: () => console.log('reCAPTCHA verified successfully'),
        'expired-callback': () => console.log('reCAPTCHA expired, please try again'),
      });
      
      await appVerifier.render();
      recaptchaRef.current = appVerifier;
      
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      setVerificationId(confirmationResult.verificationId);
      setCooldown(60);
      toast.success('OTP sent to phone!');
    } catch (err) {
      console.error('Error sending OTP:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to send OTP. Please check Firebase config.';
      const containsWait = typeof msg === 'string' && msg.toLowerCase().includes('wait');
      if (!containsWait) {
        toast.error(msg);
      }
    }
  };

  const handleVerify = async (arg) => {
    if (arg && typeof arg.preventDefault === 'function') {
      arg.preventDefault();
    }
    if (!auth) {
      toast.error('Firebase not configured');
      return;
    }
    if (!otp || otp.length < 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }
    if (!verificationId) {
      toast.error('Please send OTP first');
      return;
    }

    setIsLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await signInWithCredential(auth, credential);
      const idToken = await userCredential.user.getIdToken();
      const user = await verifyPhoneOTP(idToken, phone);
      const finalUser = user || authUser || {};
      const userRole = finalUser.role || authRole || 'user';
      if (userRole === 'admin') navigate('/admin-dashboard');
      else if (userRole === 'employee') navigate('/orders');
      else navigate('/menu');
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.message || 'Invalid OTP';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!auth) {
      toast.error('Firebase not configured');
      return;
    }
    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown}s before resending`);
      return;
    }
    setIsResendLoading(true);
    try {
      await initFirebasePhoneAuth();
      toast.success('A new OTP has been generated and sent to your phone.');
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate a new OTP';
      toast.error(errorMsg);
    } finally {
      setIsResendLoading(false);
    }
  };

  if (!phone) return null;

  if (!firebaseReady || !auth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pt-24 pb-12 flex items-center justify-center transition-colors duration-300">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-8 mx-auto w-24 h-24 bg-white dark:bg-white/5 rounded-3xl flex items-center justify-center shadow-xl border border-gray-100 dark:border-white/10 transition-colors">
            ⚠️
          </div>
          <h1 className="text-3xl font-black mb-4">Phone OTP not available</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
            Firebase is not configured yet. Please set up your Firebase credentials in the .env file or use another login method.
          </p>
          <Link
            to="/login"
            className="inline-block px-8 py-4 rounded-2xl font-black text-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-black shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            Go back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pt-24 pb-12 flex items-center justify-center transition-colors duration-300">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="text-6xl mb-8 mx-auto w-24 h-24 bg-white dark:bg-white/5 rounded-3xl flex items-center justify-center shadow-xl border border-gray-100 dark:border-white/10 transition-colors">
            📱
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4">
            Verify Phone
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 font-medium transition-colors">
            Enter the 6-digit code sent to {phone}
          </p>
        </div>

        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-4xl p-10 border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-none transition-colors">
          <div className="space-y-6">
            <div id="recaptcha-container"></div>
            <OTPInput
              length={6}
              onOTPChange={(val) => setOtp(val)}
              onComplete={handleVerify}
            />

            <button
              type="button"
              onClick={handleVerify}
              disabled={isLoading || otp.length < 6 || !verificationId}
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
                  disabled={isResendLoading}
                  className="text-orange-500 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResendLoading ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
