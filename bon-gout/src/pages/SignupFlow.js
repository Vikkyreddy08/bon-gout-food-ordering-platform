/**
 * FILE: bon-gout/src/pages/SignupFlow.js
 * DESCRIPTION: A modern, multi-step signup process with Email verification (OTP) and Password setup.
 * PROJECT PART: Frontend (Page)
 * REQUIREMENTS:
 * - Step 1: Email Input + Send OTP
 * - Step 2: OTP Verification
 * - Step 3: Password Creation with Toggle Visibility + Role Selection
 * DESIGN: Two-column premium layout matching Login.js (desktop only).
 */

import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaLock, FaCheckCircle, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OTPInput from '../components/OTPInput';

const SignupFlow = () => {
  const { register, isLoggedIn, sendEmailOTP, verifyEmailOTPForSignup, role: authRole, user: authUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('user');
  const [accessCode, setAccessCode] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      await sendEmailOTP(email);
      toast.success("OTP sent to your email!");
      setTimer(30);
      setStep(2);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to send OTP. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (arg) => {
    if (arg && typeof arg.preventDefault === 'function') {
      arg.preventDefault();
    }
    if (otp.length < 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmailOTPForSignup(email, otp);
      toast.success("Email verified successfully! ✨");
      setStep(3);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Invalid OTP. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleFinalSignup = async (e) => {
    if (e) e.preventDefault();

    if (!username) {
      toast.error("Please choose a username.");
      return;
    }
    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!isPasswordValid) {
      toast.error('Password must be 8+ characters with uppercase, lowercase, number, and special character.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await register({
        username,
        email,
        password,
        role,
        access_code: accessCode
      });

      toast.success("Registration successful! Welcome to Bon Goût ✨");

      const finalUser = user || authUser || {};
      const userRole = finalUser.role || authRole || role;

      if (userRole === 'admin') {
        navigate('/admin-dashboard');
      } else if (userRole === 'employee') {
        navigate('/orders');
      } else {
        navigate('/menu');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Registration failed. Please check your details.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const isPasswordValid = passwordRegex.test(password);
  const isAccessCodeRequired = role === 'admin' || role === 'employee';
  const isSubmitDisabled = step === 3 && (
    password !== confirmPassword ||
    !password ||
    !username ||
    !isPasswordValid ||
    (isAccessCodeRequired && !accessCode)
  );

  const stepTitles = {
    1: 'Verify your email',
    2: 'Enter confirmation code',
    3: 'Create your account',
  };

  const stepDescriptions = {
    1: 'Enter your email to send a one-time verification code.',
    2: `We sent a 6-digit code to ${email}. Enter it below to continue.`,
    3: 'Finalize your profile details and set a secure password.',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50/80 dark:bg-slate-950 px-4 py-12 sm:py-16 overflow-hidden transition-colors duration-300">
      <div className="absolute inset-x-0 top-0 h-96 pointer-events-none overflow-hidden">
        <div className="absolute left-[-120px] top-8 w-80 h-80 rounded-full bg-orange-400/25 blur-3xl animate-blob" />
        <div className="absolute right-[-90px] top-28 w-64 h-64 rounded-full bg-yellow-400/30 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-72 h-72 rounded-full bg-orange-300/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl mx-auto animate-fade-in-up">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_50px_140px_rgba(15,23,42,0.18)] overflow-hidden border border-white/60 dark:border-white/5 grid lg:grid-cols-2">
          {/* LEFT: PREMIUM ILLUSTRATION (desktop) */}
          <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 text-white">
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-yellow-200/30 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border-[20px] border-white/8" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border-[16px] border-white/10" />

            <span className="absolute top-24 left-20 w-2.5 h-2.5 rounded-full bg-white/90 shadow-lg shadow-white/40" />
            <span className="absolute top-40 right-24 w-1.5 h-1.5 rounded-full bg-yellow-100/80" />
            <span className="absolute bottom-48 left-28 w-3 h-3 rounded-full bg-white/70" />
            <span className="absolute bottom-32 right-36 w-2 h-2 rounded-full bg-white/60" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl border border-white/20 shadow-lg">
                🍽️
              </div>
              <div>
                <div className="font-black text-xl tracking-tight">Bon Gout</div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/75 font-semibold">Fine · Dining</div>
              </div>
            </div>

            <div className="relative z-10 my-12 mx-auto w-full max-w-sm">
              <svg viewBox="0 0 320 340" className="w-full h-auto drop-shadow-[0_25px_50px_rgba(0,0,0,0.25)]" fill="none">
                <path d="M118 40 Q110 55 118 70 Q126 85 118 100" stroke="white" strokeWidth="3" strokeOpacity="0.75" strokeLinecap="round" />
                <path d="M145 32 Q137 48 145 64 Q153 80 145 96" stroke="white" strokeWidth="3" strokeOpacity="0.7" strokeLinecap="round" />
                <path d="M172 40 Q164 55 172 70 Q180 85 172 100" stroke="white" strokeWidth="3" strokeOpacity="0.75" strokeLinecap="round" />

                <ellipse cx="160" cy="260" rx="140" ry="26" fill="white" fillOpacity="0.18" />
                <ellipse cx="160" cy="254" rx="135" ry="24" fill="white" fillOpacity="0.3" />
                <ellipse cx="160" cy="210" rx="120" ry="55" fill="white" fillOpacity="0.92" />
                <ellipse cx="160" cy="200" rx="110" ry="46" fill="#FFF5EA" stroke="white" strokeWidth="3" />

                <path d="M70 205 Q90 155 160 150 Q230 155 250 205 Q225 228 160 230 Q95 228 70 205 Z" fill="#F4C064" />
                <path d="M80 202 Q100 165 160 162 Q220 165 240 202 Q220 220 160 222 Q100 220 80 202 Z" fill="#F9CF7A" />

                <circle cx="110" cy="185" r="3.5" fill="#FEF3C7" />
                <circle cx="130" cy="175" r="3" fill="#FEF9C3" />
                <circle cx="155" cy="168" r="3.2" fill="#FFFBEB" />
                <circle cx="180" cy="174" r="3" fill="#FEF3C7" />
                <circle cx="205" cy="186" r="3.5" fill="#FEF9C3" />
                <circle cx="145" cy="200" r="3" fill="#FFFBEB" />
                <circle cx="175" cy="195" r="3.2" fill="#FEF3C7" />
                <circle cx="215" cy="205" r="3" fill="#FEF9C3" />
                <circle cx="95" cy="205" r="2.8" fill="#FFFBEB" />

                <circle cx="120" cy="190" r="4" fill="#C2410C" />
                <circle cx="188" cy="192" r="3.5" fill="#B91C1C" />
                <circle cx="150" cy="208" r="3" fill="#9A3412" />
                <circle cx="210" cy="200" r="3.5" fill="#C2410C" />
                <circle cx="105" cy="200" r="3" fill="#B91C1C" />

                <path d="M100 175 Q90 170 85 180 Q92 182 100 178 Z" fill="#16A34A" />
                <path d="M215 178 Q225 173 230 183 Q223 185 215 181 Z" fill="#16A34A" />
                <path d="M155 160 Q148 152 142 160 Q150 166 155 162 Z" fill="#22C55E" />
                <path d="M170 210 Q176 204 182 212 Q176 217 170 213 Z" fill="#16A34A" />

                <g transform="translate(50,168) rotate(-18)">
                  <path d="M0 0 L40 -12 A40 40 0 0 1 44 14 Z" fill="#FDE047" stroke="white" strokeWidth="2" />
                  <path d="M5 -5 L35 -10 M8 2 L38 -1 M6 8 L40 10" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
                </g>

                <g transform="translate(248,188)">
                  <path d="M-2 0 L36 0 L32 28 Q17 34 2 28 Z" fill="#FEF3C7" stroke="white" strokeWidth="2" />
                  <circle cx="17" cy="10" r="4" fill="#EF4444" />
                  <path d="M8 14 Q12 18 20 15" stroke="#22C55E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <circle cx="26" cy="18" r="3" fill="#F97316" />
                </g>

                <g transform="translate(232,244)">
                  <path d="M0 -8 L50 -8 L46 52 Q25 60 4 52 Z" fill="white" stroke="white" strokeWidth="2" opacity="0.95" />
                  <path d="M4 0 L46 0 L44 48 Q25 55 6 48 Z" fill="#FCD34D" opacity="0.9" />
                  <circle cx="25" cy="22" r="8" fill="none" stroke="#F59E0B" strokeWidth="2" />
                  <path d="M50 4 Q62 4 62 16 Q62 28 50 28" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <rect x="-2" y="-14" width="54" height="8" rx="3" fill="white" stroke="white" strokeWidth="2" />
                </g>
              </svg>
            </div>

            <div className="relative z-10 space-y-8">
              <blockquote className="space-y-3">
                <p className="text-2xl font-black leading-snug">
                  &ldquo;Join 2,500+ Hyderabadi foodies enjoying fresh meals in 30 minutes or less.&rdquo;
                </p>
                <div className="flex items-center gap-2 text-white/80 text-sm font-semibold">
                  <span className="flex">
                    <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
                  </span>
                  <span className="opacity-80">· Rated #1 food delivery app locally</span>
                </div>
              </blockquote>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
                <div>
                  <div className="text-3xl font-black">2,500+</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/75 font-semibold mt-1">Happy users</div>
                </div>
                <div>
                  <div className="text-3xl font-black">30m</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/75 font-semibold mt-1">Avg delivery</div>
                </div>
                <div>
                  <div className="text-3xl font-black">4.9★</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/75 font-semibold mt-1">Rating</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: SIGNUP FORM */}
          <div className="p-6 sm:p-8 lg:p-12">
            {/* Mobile brand header */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="group mb-7 inline-flex items-center gap-3 focus:outline-none lg:hidden"
              aria-label="Bon Gout Home"
            >
              <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 shadow-[0_10px_30px_rgba(249,115,22,0.45)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-2deg]">
                <span className="text-xl sm:text-2xl leading-none">🍽️</span>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white dark:bg-slate-900 border-[3px] border-orange-400" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="font-cursive text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 via-yellow-600 to-orange-500 bg-clip-text text-transparent">
                  Bon Gout
                </span>
                <span className="mt-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                  Fine · Dining
                </span>
              </div>
            </button>

            <div className="mb-8">
              <h1 className="text-3xl sm:text-[34px] font-black text-slate-900 dark:text-white tracking-[-0.02em] leading-[1.15]">
                Create Account
                <span className="block h-1 mt-4 w-16 rounded-full bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
              </h1>
              <p className="mt-5 text-gray-600 dark:text-gray-400 leading-7 text-[15px]">
                <span className="font-bold text-slate-700 dark:text-gray-200">Step {step} of 3:</span> {stepDescriptions[step]}
              </p>
            </div>

            {/* Step progress pills */}
            <div className="flex items-center justify-between gap-2 mb-10 px-1">
              {[1, 2, 3].map((num) => {
                const active = step >= num;
                const current = step === num;
                const last = num === 3;
                return (
                  <React.Fragment key={num}>
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all duration-300 ${
                          active
                            ? 'bg-gradient-to-br from-orange-500 to-yellow-500 text-white border-transparent shadow-[0_10px_25px_rgba(249,115,22,0.35)] scale-105'
                            : 'bg-white dark:bg-white/5 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-white/10'
                        } ${current ? 'ring-4 ring-orange-500/15' : ''}`}
                      >
                        {step > num ? <FaCheckCircle size={16} /> : num}
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                          active ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {num === 1 ? 'Verify' : num === 2 ? 'Confirm' : 'Finalize'}
                      </span>
                    </div>
                    {!last && (
                      <div className={`flex-1 h-1.5 rounded-full mx-1 transition-all duration-500 ${
                        step > num ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gray-200 dark:bg-white/10'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {step === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-7 animate-fade-in-up">
                <div className="space-y-1.5">
                  <label htmlFor="signup-email" className="block text-sm font-bold text-gray-600 dark:text-gray-300 ml-1 tracking-wide">
                    Email Address
                  </label>
                  <div className="group relative">
                    <div className="pointer-events-none absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-yellow-500/0 opacity-0 blur transition-opacity duration-300 group-focus-within:from-orange-500/40 group-focus-within:to-yellow-500/40 group-focus-within:opacity-100" />
                    <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors z-20" size={18} />
                    <input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      className="relative z-10 zomato-input pl-14 pr-5 py-4 text-[15px] font-medium placeholder:text-gray-400/80"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-4 text-[15px] disabled:opacity-70 active:scale-[0.985] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-7 animate-fade-in-up">
                <div className="bg-orange-500/8 dark:bg-orange-500/10 rounded-2xl p-5 border border-orange-500/20 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                    📧
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600/80 dark:text-orange-400 mb-0.5">
                      Code sent
                    </p>
                    <p className="text-sm font-bold text-slate-700 dark:text-gray-200 truncate">
                      {email}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-3 ml-1 tracking-wide text-center">
                    Enter the 6-digit code
                  </label>
                  <OTPInput
                    length={6}
                    onOTPChange={setOtp}
                    onComplete={handleVerifyOTP}
                  />
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={isLoading || otp.length < 6}
                    className="btn-primary w-full py-4 text-[15px] disabled:opacity-60 active:scale-[0.985] flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Continue</span>
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </button>

                  <div className="flex justify-between items-center px-2 pt-1">
                    <button
                      type="button"
                      disabled={timer > 0 || isLoading}
                      onClick={handleSendOTP}
                      className={`text-sm font-bold transition-all ${
                        timer > 0
                          ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:underline'
                      }`}
                    >
                      {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setOtp('');
                      }}
                      className="text-sm text-gray-500 hover:text-orange-500 font-medium transition-colors"
                    >
                      ← Change Email
                    </button>
                  </div>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleFinalSignup} className="space-y-5 animate-fade-in-up">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-widest text-center">
                    I am a...
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {['user', 'employee', 'admin'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-3 rounded-2xl text-sm font-bold capitalize transition-all duration-200 border active:scale-[0.97] ${
                          role === r
                            ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-slate-900 border-orange-500/40 shadow-[0_12px_30px_rgba(249,115,22,0.35)] hover:-translate-y-0.5'
                            : 'bg-gray-50 dark:bg-white/5 text-slate-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:border-orange-400/50 hover:bg-orange-50/60 dark:hover:bg-orange-500/5 hover:shadow-md hover:-translate-y-0.5'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="signup-username" className="block text-sm font-bold text-gray-600 dark:text-gray-300 ml-1 tracking-wide">
                    Choose a Username
                  </label>
                  <div className="group relative">
                    <div className="pointer-events-none absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-yellow-500/0 opacity-0 blur transition-opacity duration-300 group-focus-within:from-orange-500/40 group-focus-within:to-yellow-500/40 group-focus-within:opacity-100" />
                    <input
                      id="signup-username"
                      type="text"
                      placeholder="e.g. foodie_raj"
                      className="relative z-10 zomato-input px-5 py-4 text-[15px] font-medium placeholder:text-gray-400/80"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {isAccessCodeRequired && (
                  <div className="space-y-1.5 animate-fade-in-up">
                    <label htmlFor="signup-access" className="block text-sm font-bold text-gray-600 dark:text-gray-300 ml-1 tracking-wide">
                      {role === 'admin' ? '🔐 Admin Access Code' : '🔐 Employee Secret Key'}
                    </label>
                    <div className="group relative">
                      <div className="pointer-events-none absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-yellow-500/0 opacity-0 blur transition-opacity duration-300 group-focus-within:from-orange-500/40 group-focus-within:to-yellow-500/40 group-focus-within:opacity-100" />
                      <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500 z-20" size={16} />
                      <input
                        id="signup-access"
                        type="password"
                        placeholder={role === 'admin' ? 'Admin access code' : 'Employee secret key'}
                        className="relative z-10 zomato-input pl-14 pr-5 py-4 text-[15px] font-medium placeholder:text-gray-400/80 border-2 border-orange-500/25 bg-orange-500/5"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="signup-password" className="block text-sm font-bold text-gray-600 dark:text-gray-300 ml-1 tracking-wide">
                    Password
                  </label>
                  <div className="group relative">
                    <div className="pointer-events-none absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-yellow-500/0 opacity-0 blur transition-opacity duration-300 group-focus-within:from-orange-500/40 group-focus-within:to-yellow-500/40 group-focus-within:opacity-100" />
                    <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors z-20" size={16} />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      className="relative z-10 zomato-input pl-14 pr-14 py-4 text-[15px] font-medium placeholder:text-gray-400/80"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-orange-500/10 hover:text-orange-500 active:scale-90 transition-all duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
                    </button>
                  </div>
                  {password && (
                    <div className="flex items-center gap-2 text-xs mt-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                          isPasswordValid
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                        }`}
                      >
                        {isPasswordValid ? <FaCheckCircle size={12} /> : '!'}
                      </span>
                      <span className={isPasswordValid ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-gray-400 font-medium'}>
                        8+ chars · uppercase · lowercase · number · special
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="signup-confirm" className="block text-sm font-bold text-gray-600 dark:text-gray-300 ml-1 tracking-wide">
                    Confirm Password
                  </label>
                  <div className="group relative">
                    <div className="pointer-events-none absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-yellow-500/0 opacity-0 blur transition-opacity duration-300 group-focus-within:from-orange-500/40 group-focus-within:to-yellow-500/40 group-focus-within:opacity-100" />
                    <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors z-20" size={16} />
                    <input
                      id="signup-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className="relative z-10 zomato-input pl-14 pr-14 py-4 text-[15px] font-medium placeholder:text-gray-400/80"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-orange-500/10 hover:text-orange-500 active:scale-90 transition-all duration-200"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
                    </button>
                  </div>
                </div>

                {password && confirmPassword && password !== confirmPassword && (
                  <div className="bg-red-500/10 dark:bg-red-500/10 rounded-2xl px-4 py-3 border border-red-500/20 flex items-center gap-3">
                    <span className="text-red-500 font-black">⚠️</span>
                    <p className="text-red-600 dark:text-red-400 text-xs font-bold">Passwords do not match!</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || isSubmitDisabled}
                  className="btn-primary w-full py-4 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.985] flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Finish Signup</span>
                      <span aria-hidden="true">🎉</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-10 pt-6 border-t border-gray-100 dark:border-white/5 text-center text-[15px] text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-all duration-200 hover:gap-2"
              >
                Sign In
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupFlow;
