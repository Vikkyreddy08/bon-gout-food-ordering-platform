/**
 * FILE: bon-gout/src/pages/Cart.js
 * DESCRIPTION: The checkout and shopping cart management page.
 * PROJECT PART: Frontend (Page)
 * INTERACTIONS: 
 * - Displays items from 'CartContext'.
 * - Handles 'COD' and 'Online' payment logic.
 * - Integrates with Razorpay for secure payments.
 * - Calls the backend API to finalize orders.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getImageUrl, DEFAULT_FOOD_IMAGE } from '../utils/imageUtils';
import OrderSuccessModal from '../components/OrderSuccessModal';
import { showOrderConfirmedToast } from '../utils/orderToast';

export default function Cart() {
  const navigate = useNavigate();
  
  // CONTEXT DATA:
  const { cart, cartCount, updateQuantity, clearCart, removeFromCart } = useCart();
  const { user, isLoggedIn, loading: authLoading, token } = useAuth();
  
  // UI STATE:
  const [loading, setLoading] = useState(false); // Tracks API submission status.
  const [showSummaryModal, setShowSummaryModal] = useState(false); // Shows order success popup.
  const cartItems = cart || [];

  // FORM STATE:
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' or 'ONLINE'.
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('Hyderabad, Telangana');
  const [lastOrder, setLastOrder] = useState(null); // Stores details of the just-placed order.

  /**
   * PURPOSE: Auto-fills the form with the user's saved profile data.
   * RUNS: Whenever the 'user' object from AuthContext changes.
   */
  React.useEffect(() => {
    if (user) {
      setCustomerName(user.first_name || user.username || '');
      setCustomerEmail(user.email || '');
      
      // LOGIC: If username looks like a phone number, use it. Otherwise use the phone field.
      const isPhone = /^\d{10}$/.test(user.username);
      if (isPhone) {
        setCustomerPhone(user.username);
      } else if (user.phone) {
        setCustomerPhone(user.phone);
      }
      if (user.address) {
        setCustomerAddress(user.address);
      }
    }
  }, [user]);

  /**
   * PURPOSE: Calculates the grand total price of all items.
   * INTERVIEW NOTE: useMemo ensures this calculation only re-runs if the items list changes.
   */
  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0).toFixed(2);
  }, [cartItems]); 

  // ==========================================
  // RAZORPAY INTEGRATION (ONLINE PAYMENTS)
  // ==========================================
  
  /**
   * PURPOSE: Dynamically loads the Razorpay script into the browser.
   * ANALOGY: Like calling a courier to come to your shop before you can send a package.
   */
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  /**
   * PURPOSE: The full sequence for handling an online payment.
   * WORKFLOW:
   * 1. Ask Backend to create a Razorpay Order ID.
   * 2. Open the Razorpay Popup UI.
   * 3. Send the Payment ID + Signature back to our backend for verification.
   * 4. Clear the cart and show success if verification passes.
   */
  const handleRazorpayPayment = async (djangoOrder) => {
    try {
      setLoading(true);
      // API: POST /api/restaurant/payments/create-razorpay-order/

      const res = await loadRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        return;
      }

      // STEP 1: Create Razorpay Order on the backend
      const response = await api.post('restaurant/payments/create/', { amount: djangoOrder.total_amount });
      
      if (!response.data || !response.data.data) {
        console.error('Payment creation response:', response.data);
        throw new Error("Failed to initialize payment gateway response.");
      }

      const { id: razorpayOrderId, amount, currency } = response.data.data;
      const keyId = process.env.REACT_APP_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error('Razorpay Key ID is not configured. Please check your environment variables.');
      }

      // STEP 2: Configure and Open Razorpay Checkout Popup
      const options = {
        key: keyId, 
        amount: amount,
        currency: currency,
        name: 'Bon Gout',
        description: `Order #${djangoOrder.order_number}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          console.log('Razorpay response received:', response);
          // STEP 3: Verify the payment signature on our backend
          try {
            const verifyRes = await api.post('restaurant/payments/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_number: djangoOrder.order_number
            });

            if (verifyRes.data.status === 'success') {
              setLastOrder(djangoOrder);
              showOrderConfirmedToast({
                orderNumber: djangoOrder.order_number,
                total: djangoOrder.total_amount ?? djangoOrder.total,
                orderId: djangoOrder.id,
                onTrack: () => {
                  setShowSummaryModal(false);
                  djangoOrder.id ? navigate(`/orders/${djangoOrder.id}`) : navigate('/orders');
                },
              });
              setShowSummaryModal(true);
              clearCart(false); // Success! Empty the cart.
            }
          } catch (err) {
            console.error('Verification failed:', err);
            toast.error('Payment verification failed but order was placed. Please contact support.');
            navigate('/orders');
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: '#f97316',
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            console.log('Payment window closed by user');
            toast.error('Payment cancelled.');
          }
        }
      };

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not found on window object.");
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Razorpay process error:', error);
      toast.error(`Payment Error: ${error.message || 'Failed to initiate payment.'}`);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // MODULAR HELPERS (PRODUCTION READY)
  // ==========================================

  /**
   * PURPOSE: Validates the payload before sending to backend.
   * ANALOGY: Like a waiter checking if you've written your address on the order slip.
   */
  const validateOrderPayload = (payload) => {
    const { customer_name, customer_phone, customer_address, items } = payload;
    
    if (!customer_name || typeof customer_name !== 'string' || customer_name.length < 2) {
      throw new Error("Invalid customer name. Please provide a proper string.");
    }
    
    // Phone validation (flexible)
    const phoneClean = String(customer_phone).replace(/\D/g, '');
    if (phoneClean.length < 10) {
      throw new Error("Phone number must be at least 10 digits.");
    }

    if (!customer_address || customer_address.trim().length < 5) {
      throw new Error("Please provide a complete delivery address (min 5 characters).");
    }

    if (!items || items.length === 0) {
      throw new Error("Cart is empty.");
    }

    return true;
  };

  /**
   * PURPOSE: API Call wrapper with basic retry logic.
   * INTERVIEW NOTE: Retries help overcome temporary network glitches.
   */
  const callOrderAPI = async (payload, retries = 1) => {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await api.post("restaurant/orders/", payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        });
        return response.data.data; // Standardized response returns {status, message, data}
      } catch (error) {
        if (i === retries) throw error;
        await new Promise(res => setTimeout(res, 1000));
      }
    }
  };

  // ==========================================
  // CORE SUBMIT FUNCTION
  // ==========================================

  /**
   * PURPOSE: The main logic triggered by the "Confirm Order" button.
   * WORKFLOW:
   * A. Prepare the data (OrderPayload).
   * B. Run client-side validation.
   * C. Call backend to create the Order record (status: pending).
   * D. Determine payment flow (Online vs COD).
   */
  const submitOrder = async () => {
    try {
      setLoading(true);

      // A. Prepare Payload
      const orderPayload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        customer_address: customerAddress.trim(),
        payment_method: paymentMethod,
        // Send only the ID and quantity for each item.
        items: cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity || 1
        }))
      };

      // B. Validate
      validateOrderPayload(orderPayload);

      // C. Create Django Order (Pending)
      const djangoOrder = await callOrderAPI(orderPayload);
      
      if (paymentMethod === 'ONLINE') {
        // D1. Online Payment Flow (Razorpay)
        await handleRazorpayPayment(djangoOrder);
      } else {
        // D2. COD Success Actions
        setLastOrder(djangoOrder);
        showOrderConfirmedToast({
          orderNumber: djangoOrder.order_number,
          total: djangoOrder.total_amount ?? djangoOrder.total,
          orderId: djangoOrder.id,
          onTrack: () => {
            setShowSummaryModal(false);
            djangoOrder.id ? navigate(`/orders/${djangoOrder.id}`) : navigate('/orders');
          },
        });
        clearCart(false); // Empty the cart.
        setShowSummaryModal(true); // Show the success popup.
      }

    } catch (error) {
      console.error('❌ ORDER FAILED:', error);
      const serverError = error.response?.data;
      const errorMsg = serverError?.message || error.message || "Failed to place order.";
      toast.error(`Order Error: ${errorMsg}`, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  // UI Bridge for current structure
  const handleSubmitOrder = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (cartItems.length === 0) return toast.error("Cart is empty!");
    
    if (!isLoggedIn) {
      toast.error("Please login to complete your order! 🔐");
      return navigate('/login');
    }

    if (user?.role === 'admin' || user?.role === 'employee') {
      return toast.error("Staff members cannot place orders! 🧑‍🍳");
    }

    submitOrder();
  };


  // Empty cart UI
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-24 px-8 text-center bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-white/10 transition-colors duration-300">
        <div className="text-8xl mb-12 animate-bounce">🛒</div>
        <h2 className="text-4xl font-bold mb-6 text-gray-200">Your Cart is Empty</h2>
        <p className="text-xl text-gray-400 mb-12 max-w-lg">
          You haven't added any items yet. Start by browsing our delicious menu!
        </p>
        <Link
          to="/menu"
          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black px-10 py-4 rounded-3xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-300"
        >
          🍽️ Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white pt-24 pb-12 transition-colors duration-300">
      {/* Order Success Modal (matches provided design) */}
      <OrderSuccessModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        order={lastOrder}
      />

      {/* Page Header */}
      <div className="text-center py-20 px-4">
        <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent mb-6">
          🛒 Shopping Cart
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Review your items and complete your order
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* LOGIN PROMPT FOR GUESTS */}
        {!isLoggedIn && (
          <div className="xl:col-span-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-orange-500/10 backdrop-blur-xl border-2 border-orange-500/30 rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-orange-500/5">
              <div className="text-center md:text-left space-y-2">
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">Ready to checkout? 🥘</h3>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Please login to your account to place this order and track its progress.</p>
              </div>
              <Link 
                to="/login" 
                className="whitespace-nowrap bg-orange-500 hover:bg-orange-600 text-black px-10 py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
              >
                🔐 Login to Order
              </Link>
            </div>
          </div>
        )}

        {/* Delivery Details Form */}
        <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 md:p-10 border border-gray-200 dark:border-gray-800 shadow-[0_25px_65px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-gradient-to-br from-orange-400/20 to-yellow-400/10 blur-3xl pointer-events-none"/>
          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 shadow-[0_12px_28px_rgba(249,115,22,0.35)] flex items-center justify-center text-2xl">
                📍
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Delivery Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">Where should we deliver your order?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-1 space-y-2">
                <label htmlFor="customerName" className="block text-sm font-bold text-gray-600 dark:text-gray-300 ml-1 tracking-wide">Customer Name</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-yellow-500/0 opacity-0 blur transition-opacity duration-300 group-focus-within:from-orange-500/40 group-focus-within:to-yellow-500/40 group-focus-within:opacity-100"/>
                  <input
                    id="customerName"
                    name="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your Full Name"
                    className="relative z-10 w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-[22px] px-5 py-3.5 text-[15px] font-medium text-slate-900 dark:text-white placeholder:text-gray-400/80 focus:outline-none focus:border-orange-500/60 dark:focus:border-orange-400/50 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="md:col-span-1 space-y-2">
                <label htmlFor="customerPhone" className="block text-sm font-bold text-gray-600 dark:text-gray-300 ml-1 tracking-wide">Phone Number</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-yellow-500/0 opacity-0 blur transition-opacity duration-300 group-focus-within:from-orange-500/40 group-focus-within:to-yellow-500/40 group-focus-within:opacity-100"/>
                  <input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="relative z-10 w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-[22px] px-5 py-3.5 text-[15px] font-medium text-slate-900 dark:text-white placeholder:text-gray-400/80 focus:outline-none focus:border-orange-500/60 dark:focus:border-orange-400/50 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="customerEmail" className="block text-sm font-bold text-gray-600 dark:text-gray-300 ml-1 tracking-wide">Email Address <span className="text-gray-400 dark:text-gray-500 font-normal">(for order updates & invoice)</span></label>
                <div className="group relative">
                  <div className="pointer-events-none absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-yellow-500/0 opacity-0 blur transition-opacity duration-300 group-focus-within:from-orange-500/40 group-focus-within:to-yellow-500/40 group-focus-within:opacity-100"/>
                  <input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="relative z-10 w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-[22px] px-5 py-3.5 text-[15px] font-medium text-slate-900 dark:text-white placeholder:text-gray-400/80 focus:outline-none focus:border-orange-500/60 dark:focus:border-orange-400/50 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="customerAddress" className="block text-sm font-bold text-gray-600 dark:text-gray-300 ml-1 tracking-wide">Delivery Address</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-yellow-500/0 opacity-0 blur transition-opacity duration-300 group-focus-within:from-orange-500/40 group-focus-within:to-yellow-500/40 group-focus-within:opacity-100"/>
                  <textarea
                    id="customerAddress"
                    name="customerAddress"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="House / Flat No, Street, Area, Landmark, City, Pincode"
                    rows="3"
                    className="relative z-10 w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-[22px] px-5 py-3.5 text-[15px] font-medium text-slate-900 dark:text-white placeholder:text-gray-400/80 focus:outline-none focus:border-orange-500/60 dark:focus:border-orange-400/50 transition-all duration-200 resize-none"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-3 pt-2">
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 ml-1 tracking-wide">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {['COD', 'ONLINE'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      aria-pressed={paymentMethod === method}
                      className={`py-4 px-4 rounded-2xl font-bold text-[14px] sm:text-sm transition-all duration-200 border-2 focus:outline-none focus:ring-4 focus:ring-orange-200/60 dark:focus:ring-orange-500/30 active:scale-[0.97] ${
                        paymentMethod === method
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-slate-900 border-orange-500/40 shadow-[0_14px_32px_rgba(249,115,22,0.38)] hover:shadow-[0_18px_40px_rgba(249,115,22,0.45)] hover:-translate-y-0.5'
                          : 'bg-gray-50 dark:bg-white/5 text-slate-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-orange-400/50 hover:bg-orange-50/60 dark:hover:bg-orange-500/5 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      <span className="flex flex-col items-center gap-1.5">
                        <span className="text-2xl">{method === 'COD' ? '💵' : '💳'}</span>
                        <span>{method === 'COD' ? 'Cash on Delivery' : 'Pay Online'}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="relative rounded-[2rem] p-8 md:p-10 border border-orange-400/25 dark:border-orange-400/20 shadow-[0_25px_65px_rgba(249,115,22,0.1)] overflow-hidden bg-gradient-to-br from-orange-500/12 via-yellow-500/8 to-orange-500/12 dark:from-orange-500/15 dark:via-yellow-500/10 dark:to-orange-500/15">
          <div className="absolute -top-20 -left-16 w-56 h-56 rounded-full bg-gradient-to-br from-orange-400/25 to-yellow-400/15 blur-3xl pointer-events-none"/>
          <div className="absolute -bottom-20 -right-16 w-56 h-56 rounded-full bg-gradient-to-tr from-yellow-400/20 to-orange-400/20 blur-3xl pointer-events-none"/>
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-sm border border-white/60 dark:border-white/20 rounded-full px-4 py-1.5 mb-7">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
              <span className="text-xs font-bold text-slate-700 dark:text-gray-200 tracking-wide uppercase">Order Summary</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pb-8 border-b border-orange-500/20 dark:border-white/15">
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-orange-600/80 dark:text-orange-400/80 mb-1.5">Items</div>
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 bg-clip-text text-transparent leading-none">
                  {cartItems.length}
                </div>
              </div>
              <div className="md:col-span-1 md:pl-6 md:border-l border-gray-200 dark:border-white/15">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-orange-600/80 dark:text-orange-400/80 mb-1.5">Total</div>
                <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-none">
                  ₹{totalPrice}
                </div>
              </div>
              <div className="hidden md:flex md:col-span-1 md:pl-6 md:border-l border-gray-200 dark:border-white/15 flex-col gap-1 justify-center">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-gray-300">
                  <span>🚚</span><span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-gray-300">
                  <span>🔥</span><span>30 min Guarantee</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <button
                onClick={clearCart}
                disabled={loading}
                className="group relative bg-white/60 dark:bg-white/5 hover:bg-red-500/15 text-red-600 dark:text-red-400 border-2 border-red-500/30 hover:border-red-500/60 py-4 px-6 rounded-2xl font-black text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(239,68,68,0.2)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
              >
                <span className="text-xl">🗑️</span>
                <span>Clear All</span>
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={loading || authLoading}
                className="group relative bg-[#ff7961] hover:bg-[#ff6853] text-white font-black py-4 px-6 rounded-2xl text-base shadow-[0_18px_45px_rgba(255,121,97,0.45)] hover:shadow-[0_24px_60px_rgba(255,121,97,0.55)] hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Creating Order...
                  </>
                ) : (
                  <>
                    <span className="text-xl">🚀</span>
                    <span>Place Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="space-y-6">
          {cartItems.map((item) => (
            <div key={item.id} className="group bg-gray-50 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-gray-200 dark:border-white/20 hover:border-orange-400/50 hover:shadow-2xl transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 items-start gap-6 lg:gap-8">
                {/* Image + Badges */}
                <div className="relative flex-shrink-0">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="w-32 h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 rounded-2xl object-cover shadow-2xl group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = DEFAULT_FOOD_IMAGE; }}
                  />
                  <div className="absolute top-2 left-2 z-10">
                    <span className="inline-block bg-green-500/95 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                      {item.is_veg ? '🌿 Veg' : '🍗 Non-Veg'}
                    </span>
                  </div>
                  {item.is_spicy && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="bg-red-500/95 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                        🌶️ Spicy
                      </span>
                    </div>
                  )}
                </div>

                {/* Details + Price */}
                <div className="lg:col-span-2 xl:col-span-1 space-y-3 lg:pr-8">
                  <h3 className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm lg:text-base leading-relaxed line-clamp-2">
                    {item.desc || item.description || 'Delicious dish'}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-lg lg:text-xl font-bold text-orange-400">₹{item.price}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">× {item.quantity || 1}</span>
                    <span className="text-2xl lg:text-3xl font-black text-orange-500 ml-auto">
                      ₹{(Number(item.price) * Number(item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                  {item.prep && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>⏱️ {item.prep}</span>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4 pt-4 lg:pt-0 lg:col-span-1">
                  <div className="flex items-center bg-gray-100 dark:bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-200 dark:border-white/20">
                    <button
                      onClick={() => {
                        const currentQty = item.quantity || 1;
                        if (currentQty <= 1) {
                          removeFromCart(item.id);
                          toast.success(`Removed ${item.name}! 🗑️`);
                        } else {
                          updateQuantity(item.id, currentQty - 1);
                        }
                      }}
                      disabled={loading}
                      className="w-12 h-12 flex items-center justify-center text-xl font-bold text-gray-400 dark:text-gray-200 hover:text-orange-500 hover:bg-orange-500/20 rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-xl font-bold text-gray-900 dark:text-white mx-4">
                      {item.quantity || 1}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                      disabled={loading}
                      className="w-12 h-12 flex items-center justify-center text-xl font-bold text-gray-400 dark:text-gray-200 hover:text-orange-500 hover:bg-orange-500/20 rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      removeFromCart(item.id);
                      toast.success(`Removed ${item.name} from cart! 🗑️`);
                    }}
                    disabled={loading}
                    className="text-red-400 hover:text-red-300 font-semibold px-6 py-3 rounded-xl border-2 border-red-400/50 hover:bg-red-500/20 transition-all duration-300 hover:scale-105 whitespace-nowrap bg-white/5 backdrop-blur-sm disabled:opacity-50"
                  >
                    Remove Item
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
