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
    return cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0).toFixed(2);
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
      console.log('Initiating Razorpay for order:', djangoOrder.order_number);

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
      const keyId = process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_YOUR_ACTUAL_KEY';

      if (keyId === 'rzp_test_YOUR_ACTUAL_KEY') {
        console.warn('Using placeholder Razorpay Key ID. Payment portal might not open.');
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
              toast.success('Payment Verified! ✨');
              setLastOrder(djangoOrder);
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
        toast.success(`Order #${djangoOrder.order_number} confirmed! 🚀`, { duration: 4000 });
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
    if (!isLoggedIn) return navigate('/login');
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
      {/* Order Summary Modal (Production Ready) */}
      {showSummaryModal && lastOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="bg-white dark:bg-[#1a1c1e] rounded-[3rem] p-10 max-w-2xl w-full border border-gray-200 dark:border-orange-500/20 shadow-2xl dark:shadow-[0_0_100px_rgba(249,115,22,0.15)] overflow-hidden relative transition-colors duration-300">
            {/* Background Decoration */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px]"></div>
            
            <div className="relative text-center space-y-8">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-5xl animate-bounce">
                🎉
              </div>
              
              <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Order Confirmed!</h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Your delicious meal is being prepared.</p>
              </div>

              {/* Order Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-3xl border border-gray-200 dark:border-white/10 text-left">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Order Number</p>
                  <p className="text-xl font-black text-orange-500">#{lastOrder.order_number}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-3xl border border-gray-200 dark:border-white/10 text-left">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Est. Delivery</p>
                  <p className="text-xl font-black text-green-600 dark:text-green-400">35 - 45 Mins</p>
                </div>
              </div>

              {/* Items Summary */}
              <div className="bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="px-6 py-4 bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                  <span className="font-bold text-gray-600 dark:text-gray-300">Order Summary</span>
                  <span className="text-orange-500 font-black">₹{lastOrder.total_amount}</span>
                </div>
                <div className="p-6 max-h-40 overflow-y-auto space-y-3">
                  {lastOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{item.name || item.menu_item_name} × {item.quantity}</span>
                      <span className="text-gray-900 dark:text-white font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button
                  onClick={() => {
                    setShowSummaryModal(false);
                    navigate('/orders');
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-black py-5 rounded-2xl text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Track Order Progress 🚀
                </button>
                <button
                  onClick={() => {
                    setShowSummaryModal(false);
                    navigate('/menu');
                  }}
                  className="w-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold py-4 rounded-2xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/10"
                >
                  Back to Menu
                </button>
              </div>
              
              <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] font-bold">
                A confirmation email has been sent to {lastOrder.customer_email || 'your inbox'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="text-center py-20 px-4">
        <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent mb-6">
          🛒 Shopping Cart
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
          Review your order before checkout ({cartCount} items)
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        {/* Delivery Details Form */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-black text-orange-400 mb-6 flex items-center gap-2">
            📍 Delivery Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-1 space-y-2">
              <label htmlFor="customerName" className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Customer Name</label>
              <input
                id="customerName"
                name="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl px-6 py-4 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-all shadow-sm dark:shadow-none"
              />
            </div>
            <div className="md:col-span-1 space-y-2">
              <label htmlFor="customerPhone" className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Phone Number</label>
              <input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10-digit number"
                className="w-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl px-6 py-4 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-all shadow-sm dark:shadow-none"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="customerEmail" className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Email Address (for Invoice)</label>
              <input
                id="customerEmail"
                name="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl px-6 py-4 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-all shadow-sm dark:shadow-none"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="customerAddress" className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Delivery Address</label>
              <textarea
                id="customerAddress"
                name="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Full delivery address"
                rows="3"
                className="w-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl px-6 py-4 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-all resize-none shadow-sm dark:shadow-none"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Payment Method</label>
              <div className="flex gap-4">
                {['COD', 'ONLINE'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex-1 py-4 rounded-2xl font-bold transition-all shadow-sm active:scale-95 ${
                      paymentMethod === method 
                        ? 'bg-orange-500 text-black border-2 border-orange-500' 
                        : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-2 border-gray-200 dark:border-white/10 hover:border-orange-500/50'
                    }`}
                  >
                    {method === 'COD' ? '💵 Cash on Delivery' : '💳 Pay Online'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 backdrop-blur-xl rounded-3xl p-8 border border-orange-400/30 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
            <div>
              <div className="text-3xl md:text-4xl font-black text-orange-400">{cartItems.length} Items</div>
              <div className="text-gray-500 dark:text-gray-400 mt-1">in your cart</div>
            </div>
            <div className="border-l border-gray-200 dark:border-white/20 md:pl-8 md:border-l">
              <div className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">₹{totalPrice}</div>
              <div className="text-gray-500 dark:text-gray-400 text-lg mt-1">Total Amount</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 pt-8 border-t border-white/20">
            <button
              onClick={clearCart}
              disabled={loading}
              className="bg-red-600/20 hover:bg-red-600/40 text-red-100 border-2 border-red-500/40 py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
            >
              🗑️ Clear All Items
            </button>
            <button
              onClick={handleSubmitOrder}
              disabled={loading || authLoading}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black font-black py-4 px-8 rounded-2xl text-lg shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  Creating Order...
                </>
              ) : (
                '🚀 Proceed to Checkout'
              )}
            </button>
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
                      ₹{(item.price * (item.quantity || 1)).toFixed(2)}
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
