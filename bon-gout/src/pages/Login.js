/**
 * FILE: bon-gout/src/pages/Login.js
 * DESCRIPTION: The customer sign-in page using email and password.
 * PROJECT PART: Frontend (Page)
 * INTERACTIONS:
 * - Communicates with 'AuthContext.js' to perform login.
 * - Redirects users to the appropriate dashboard based on role.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
    access_code: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const isDev = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      toast.error('Please fill in both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login({
        username: formData.username,
        password: formData.password,
        access_code: formData.access_code,
      });

      if (user?.role === 'admin') navigate('/admin-dashboard');
      else if (user?.role === 'employee') navigate('/orders');
      else navigate('/menu');
    } catch (error) {
      // AuthContext already displays toast messages.
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      toast.error('Google sign-in failed. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await googleLogin(idToken);
      if (user?.role === 'admin') navigate('/admin-dashboard');
      else if (user?.role === 'employee') navigate('/orders');
      else navigate('/menu');
    } catch (error) {
      // AuthContext already shows the error.
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google sign-in was cancelled or failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-orange-50/80 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center py-12 sm:py-16 px-4 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-96 pointer-events-none overflow-hidden">
        <div className="absolute left-[-120px] top-8 w-80 h-80 rounded-full bg-orange-400/25 blur-3xl animate-blob" />
        <div className="absolute right-[-90px] top-28 w-64 h-64 rounded-full bg-yellow-400/30 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-72 h-72 rounded-full bg-orange-300/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl mx-auto animate-fade-in-up">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_50px_140px_rgba(15,23,42,0.18)] overflow-hidden border border-white/60 dark:border-white/5 grid lg:grid-cols-2">
          {/* LEFT: PREMIUM FOOD ILLUSTRATION PANEL (desktop only) */}
          <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 text-white">
            {/* Decorative blobs */}
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-yellow-200/30 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border-[20px] border-white/8" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border-[16px] border-white/10" />

            {/* Sparkle dots */}
            <span className="absolute top-24 left-20 w-2.5 h-2.5 rounded-full bg-white/90 shadow-lg shadow-white/40" />
            <span className="absolute top-40 right-24 w-1.5 h-1.5 rounded-full bg-yellow-100/80" />
            <span className="absolute bottom-48 left-28 w-3 h-3 rounded-full bg-white/70" />
            <span className="absolute bottom-32 right-36 w-2 h-2 rounded-full bg-white/60" />
            <span className="absolute top-1/3 right-16 w-1.5 h-1.5 rounded-full bg-white/80" />

            {/* Top brand tag */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl border border-white/20 shadow-lg">
                🍽️
              </div>
              <div>
                <div className="font-black text-xl tracking-tight">Bon Gout</div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/75 font-semibold">Fine · Dining</div>
              </div>
            </div>

            {/* Center illustration (premium food art) */}
            <div className="relative z-10 my-12 mx-auto w-full max-w-sm">
              <svg viewBox="0 0 320 340" className="w-full h-auto drop-shadow-[0_25px_50px_rgba(0,0,0,0.25)]" fill="none">
                {/* Steam lines */}
                <path d="M118 40 Q110 55 118 70 Q126 85 118 100" stroke="white" strokeWidth="3" strokeOpacity="0.75" strokeLinecap="round" />
                <path d="M145 32 Q137 48 145 64 Q153 80 145 96" stroke="white" strokeWidth="3" strokeOpacity="0.7" strokeLinecap="round" />
                <path d="M172 40 Q164 55 172 70 Q180 85 172 100" stroke="white" strokeWidth="3" strokeOpacity="0.75" strokeLinecap="round" />

                {/* Plate / bowl outer */}
                <ellipse cx="160" cy="260" rx="140" ry="26" fill="white" fillOpacity="0.18" />
                <ellipse cx="160" cy="254" rx="135" ry="24" fill="white" fillOpacity="0.3" />
                <ellipse cx="160" cy="210" rx="120" ry="55" fill="white" fillOpacity="0.92" />
                <ellipse cx="160" cy="200" rx="110" ry="46" fill="#FFF5EA" stroke="white" strokeWidth="3" />

                {/* Biryani / Rice mound */}
                <path d="M70 205 Q90 155 160 150 Q230 155 250 205 Q225 228 160 230 Q95 228 70 205 Z" fill="#F4C064" />
                <path d="M80 202 Q100 165 160 162 Q220 165 240 202 Q220 220 160 222 Q100 220 80 202 Z" fill="#F9CF7A" />

                {/* Rice grain highlights */}
                <circle cx="110" cy="185" r="3.5" fill="#FEF3C7" />
                <circle cx="130" cy="175" r="3" fill="#FEF9C3" />
                <circle cx="155" cy="168" r="3.2" fill="#FFFBEB" />
                <circle cx="180" cy="174" r="3" fill="#FEF3C7" />
                <circle cx="205" cy="186" r="3.5" fill="#FEF9C3" />
                <circle cx="145" cy="200" r="3" fill="#FFFBEB" />
                <circle cx="175" cy="195" r="3.2" fill="#FEF3C7" />
                <circle cx="215" cy="205" r="3" fill="#FEF9C3" />
                <circle cx="95" cy="205" r="2.8" fill="#FFFBEB" />

                {/* Masala / toppings spots */}
                <circle cx="120" cy="190" r="4" fill="#C2410C" />
                <circle cx="188" cy="192" r="3.5" fill="#B91C1C" />
                <circle cx="150" cy="208" r="3" fill="#9A3412" />
                <circle cx="210" cy="200" r="3.5" fill="#C2410C" />
                <circle cx="105" cy="200" r="3" fill="#B91C1C" />

                {/* Coriander leaves */}
                <path d="M100 175 Q90 170 85 180 Q92 182 100 178 Z" fill="#16A34A" />
                <path d="M215 178 Q225 173 230 183 Q223 185 215 181 Z" fill="#16A34A" />
                <path d="M155 160 Q148 152 142 160 Q150 166 155 162 Z" fill="#22C55E" />
                <path d="M170 210 Q176 204 182 212 Q176 217 170 213 Z" fill="#16A34A" />

                {/* Lemon wedge */}
                <g transform="translate(50,168) rotate(-18)">
                  <path d="M0 0 L40 -12 A40 40 0 0 1 44 14 Z" fill="#FDE047" stroke="white" strokeWidth="2" />
                  <path d="M5 -5 L35 -10 M8 2 L38 -1 M6 8 L40 10" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
                </g>

                {/* Side salad cup */}
                <g transform="translate(248,188)">
                  <path d="M-2 0 L36 0 L32 28 Q17 34 2 28 Z" fill="#FEF3C7" stroke="white" strokeWidth="2" />
                  <circle cx="17" cy="10" r="4" fill="#EF4444" />
                  <path d="M8 14 Q12 18 20 15" stroke="#22C55E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <circle cx="26" cy="18" r="3" fill="#F97316" />
                </g>

                {/* Bottom cup (drink) */}
                <g transform="translate(232,244)">
                  <path d="M0 -8 L50 -8 L46 52 Q25 60 4 52 Z" fill="white" stroke="white" strokeWidth="2" opacity="0.95" />
                  <path d="M4 0 L46 0 L44 48 Q25 55 6 48 Z" fill="#FCD34D" opacity="0.9" />
                  <circle cx="25" cy="22" r="8" fill="none" stroke="#F59E0B" strokeWidth="2" />
                  <path d="M50 4 Q62 4 62 16 Q62 28 50 28" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <rect x="-2" y="-14" width="54" height="8" rx="3" fill="white" stroke="white" strokeWidth="2" />
                </g>
              </svg>
            </div>

            {/* Bottom quote + stats */}
            <div className="relative z-10 space-y-8">
              <blockquote className="space-y-3">
                <p className="text-2xl font-black leading-snug">
                  “Hyderabad&rsquo;s most loved flavors, delivered hot in under 30 minutes.”
                </p>
                <div className="flex items-center gap-2 text-white/80 text-sm font-semibold">
                  <span className="flex">
                    <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
                  </span>
                  <span className="opacity-80">· 4.9 / 5 from 2,500+ foodies</span>
                </div>
              </blockquote>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
                <div>
                  <div className="text-3xl font-black">80+</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/75 font-semibold mt-1">Dishes</div>
                </div>
                <div>
                  <div className="text-3xl font-black">30m</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/75 font-semibold mt-1">Delivery</div>
                </div>
                <div>
                  <div className="text-3xl font-black">100%</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/75 font-semibold mt-1">Fresh</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: FORM PANEL */}
          <div className="p-6 sm:p-8 lg:p-12">
            <div className="mb-8 sm:mb-9">
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
                  <span className="font-cursive text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 via-yellow-600 to-orange-500 bg-clip-text text-transparent transition-transform duration-300 group-hover:translate-x-[2px]">
                    Bon Gout
                  </span>
                  <span className="mt-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-300">
                    Fine · Dining
                  </span>
                </div>
              </button>

              <h1 className="text-3xl sm:text-[34px] font-black text-slate-900 dark:text-white tracking-[-0.02em] leading-[1.15]">
                Login to order your next favorite meal
                <span
                  className={`ml-1.5 inline-block w-[3px] sm:w-1 align-[0.15em] rounded-full bg-gradient-to-b from-orange-500 to-yellow-500 transition-opacity duration-100 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}
                  style={{ height: '0.9em' }}
                />
                <span className="block h-1 mt-4 w-16 rounded-full bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
              </h1>
              <p className="mt-5 text-gray-600 dark:text-gray-400 leading-7 text-[15px]">
                Use email or username plus password to sign in quickly. Google login is available, and staff can sign in with their access code.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-3 tracking-wide">I am signing in as</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {['user', 'employee', 'admin'].map((roleOption) => (
                    <button
                      key={roleOption}
                      type="button"
                      aria-pressed={formData.role === roleOption}
                      onClick={() => setFormData((prev) => ({ ...prev, role: roleOption }))}
                      className={`py-3 rounded-2xl text-sm font-bold transition-all duration-200 border focus:outline-none focus:ring-4 focus:ring-orange-200/60 dark:focus:ring-orange-500/30 active:scale-[0.97] ${
                        formData.role === roleOption
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-slate-900 border-orange-500/40 shadow-[0_12px_30px_rgba(249,115,22,0.35)] hover:shadow-[0_16px_38px_rgba(249,115,22,0.45)] hover:-translate-y-0.5'
                          : 'bg-gray-50 dark:bg-white/5 text-slate-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:border-orange-400/50 hover:bg-orange-50/60 dark:hover:bg-orange-500/5 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {roleOption === 'user' ? 'Customer' : roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-sm font-bold text-gray-600 dark:text-gray-300 ml-1 tracking-wide">
                  Email or Username
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-yellow-500/0 opacity-0 blur transition-opacity duration-300 group-focus-within:from-orange-500/40 group-focus-within:to-yellow-500/40 group-focus-within:opacity-100" />
                  <input
                    id="username"
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="relative z-10 zomato-input px-5 py-3.5 text-[15px] font-medium placeholder:text-gray-400/80"
                    placeholder="Enter your email or username"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-bold text-gray-600 dark:text-gray-300 ml-1 tracking-wide">
                  Password
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-yellow-500/0 opacity-0 blur transition-opacity duration-300 group-focus-within:from-orange-500/40 group-focus-within:to-yellow-500/40 group-focus-within:opacity-100" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="relative z-10 zomato-input pr-14 px-5 py-3.5 text-[15px] font-medium placeholder:text-gray-400/80"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-orange-500/10 hover:text-orange-500 active:scale-90 transition-all duration-200"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>

              {(formData.role === 'employee' || formData.role === 'admin') && (
                <div className="space-y-1.5">
                  <label htmlFor="access_code" className="block text-sm font-bold text-gray-600 dark:text-gray-300 ml-1 tracking-wide">
                    {formData.role === 'admin' ? 'Admin Access Code' : 'Employee Access Code'}
                  </label>
                  <div className="group relative">
                    <div className="pointer-events-none absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-yellow-500/0 opacity-0 blur transition-opacity duration-300 group-focus-within:from-orange-500/40 group-focus-within:to-yellow-500/40 group-focus-within:opacity-100" />
                    <input
                      id="access_code"
                      type={showAccessCode ? 'text' : 'password'}
                      name="access_code"
                      value={formData.access_code}
                      onChange={handleChange}
                      required
                      className="relative z-10 zomato-input pr-14 px-5 py-3.5 text-[15px] font-medium placeholder:text-gray-400/80"
                      placeholder="Enter access code"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-orange-500/10 hover:text-orange-500 active:scale-90 transition-all duration-200"
                      onClick={() => setShowAccessCode((prev) => !prev)}
                      aria-label={showAccessCode ? 'Hide access code' : 'Show access code'}
                    >
                      {showAccessCode ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                  <p className="mt-2.5 text-sm text-gray-500 dark:text-gray-400 leading-6">
                    Use your provided staff access code to continue securely.
                  </p>
                  {isDev && (
                    <p className="mt-2 text-sm text-orange-600 dark:text-orange-400 font-bold">
                      Dev hint: use <span className="font-mono bg-orange-100 dark:bg-orange-500/10 px-2 py-0.5 rounded-md">{formData.role === 'admin' ? 'ADMIN123' : 'EMP123'}</span>.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-200 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-2xl active:scale-[0.985]"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <div className="flex items-center gap-4 mb-5">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  Or continue with
                </p>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-md hover:shadow-lg transition-shadow duration-300">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
              </div>
            </div>

            <div className="mt-7 sm:mt-8 text-center text-[15px] text-gray-600 dark:text-gray-400">
              Don&rsquo;t have an account?{' '}
              <Link
                to="/signup"
                className="inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-all duration-200 hover:gap-2"
              >
                Sign up
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
