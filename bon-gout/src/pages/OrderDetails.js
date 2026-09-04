import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_FLOW = [
  { key: 'placed', title: 'Order Placed', desc: 'Your order was placed for delivery.' },
  { key: 'pending', title: 'Pending', desc: 'Your order is pending for confirmation. Will confirm within 5 minutes.' },
  { key: 'confirmed', title: 'Confirmed', desc: 'Your order is confirmed. Will deliver soon.' },
  { key: 'processing', title: 'Processing', desc: 'Your order is being prepared with care.' },
  { key: 'delivered', title: 'Delivered', desc: 'Your order has been delivered. Enjoy your meal!' },
];

const BACKEND_TO_STEP = {
  pending: 2,
  confirmed: 3,
  preparing: 4,
  ready: 4,
  out_for_delivery: 4,
  delivered: 5,
  cancelled: 0,
};

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

function addMinutes(dateStr, minutes) {
  const d = new Date(dateStr);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

function toNum(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, token } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn && token && id) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, token, id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`restaurant/orders/${id}/`);
      const data = response.data.data || response.data;
      setOrder(data);
    } catch (error) {
      console.error('Order details error:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? BACKEND_TO_STEP[order.status] || 0 : 0;
  const isCancelled = order?.status === 'cancelled';

  const getStepTimes = () => {
    if (!order) return STATUS_FLOW.map(() => '');
    const created = order.created_at || order.updated_at || new Date().toISOString();
    return [
      formatTime(created),
      formatTime(addMinutes(created, 0)),
      formatTime(addMinutes(created, 5)),
      formatTime(addMinutes(created, 15)),
      formatTime(addMinutes(created, 45)),
    ];
  };

  const stepTimes = getStepTimes();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Access Restricted</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Please login to view order details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Green Header with wavy bottom */}
      <div className="relative bg-gradient-to-br from-green-500 to-green-600 pt-6 pb-20 md:pt-8 md:pb-24">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-all active:scale-95"
              aria-label="Go back"
            >
              <FaArrowLeft className="text-white text-lg" />
            </button>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Order details
            </h1>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 w-full h-10 md:h-14 text-gray-50 dark:text-gray-900" viewBox="0 0 1440 54" preserveAspectRatio="none">
          <path
            fill="currentColor"
            d="M0,22 C240,54 480,54 720,30 C960,6 1200,6 1440,22 L1440,54 L0,54 Z"
          />
        </svg>
      </div>

      {/* Content area */}
      <div className="max-w-2xl mx-auto px-4 -mt-10 md:-mt-14 pb-16">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center shadow-lg">
            <div className="animate-spin text-4xl mb-4 text-green-500">⏳</div>
            <h3 className="text-lg font-bold text-gray-500">Loading order details...</h3>
          </div>
        ) : !order ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center shadow-lg">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">Order not found</h3>
            <p className="text-gray-400 text-sm mb-6">This order might not exist or was removed.</p>
            <button
              onClick={() => navigate('/orders')}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-2xl shadow-lg transition-all active:scale-95"
            >
              Back to Orders
            </button>
          </div>
        ) : (
          <>
            {/* Order number / total quick summary card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-black text-gray-900 dark:text-white">
                  Order #{order.order_number}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase border border-green-500/30 bg-green-500/15 text-green-600 dark:text-green-400">
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                <span>📅</span>
                <span>
                  {new Date(order.created_at || order.updated_at).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true,
                  })}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-lg mb-6">
              {isCancelled ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-500/15 flex items-center justify-center mb-4">
                    <span className="text-3xl">❌</span>
                  </div>
                  <h3 className="text-xl font-black text-red-500 mb-2">Order Cancelled</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    This order was cancelled. Please contact support for more details.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {STATUS_FLOW.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isDone = stepNum <= currentStep;
                    const isCurrent = stepNum === currentStep;
                    const isLast = idx === STATUS_FLOW.length - 1;

                    return (
                      <div key={step.key} className="relative flex gap-4 md:gap-6">
                        {/* Time column */}
                        <div className="w-20 md:w-24 flex-shrink-0 pt-1">
                          <span
                            className={`text-xs md:text-sm font-bold tracking-wide ${
                              isDone ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'
                            }`}
                          >
                            {stepTimes[idx]}
                          </span>
                        </div>

                        {/* Connector + circle */}
                        <div className="relative flex flex-col items-center flex-shrink-0 w-9">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all ${
                              isDone
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                            } ${isCurrent ? 'ring-4 ring-green-500/20' : ''}`}
                          >
                            {isDone ? (
                              <FaCheck className="w-4 h-4" />
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                            )}
                          </div>
                          {!isLast && (
                            <div
                              className={`w-0.5 flex-1 min-h-[50px] ${
                                isDone ? 'bg-green-500/70' : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            />
                          )}
                        </div>

                        {/* Text content */}
                        <div className={`pb-8 flex-1 ${isLast ? 'pb-0' : ''}`}>
                          <h3
                            className={`text-lg md:text-xl font-black leading-snug mb-1 ${
                              isDone
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}
                          >
                            {step.title}
                          </h3>
                          <p
                            className={`text-sm md:text-base leading-relaxed ${
                              isDone
                                ? 'text-gray-500 dark:text-gray-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          >
                            {step.key === 'placed'
                              ? `Your order #${order.order_number} was placed for delivery.`
                              : step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Description / Items section (green card like reference) */}
            <div className="relative overflow-hidden rounded-3xl shadow-lg mb-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 px-6 pt-5 pb-1.5">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  Description
                </h2>
              </div>
              <svg className="block w-full text-white dark:text-gray-800" viewBox="0 0 400 14" preserveAspectRatio="none">
                <path
                  fill="currentColor"
                  d="M0,0 L100,14 L200,0 L300,14 L400,0 L400,14 L0,14 Z"
                />
              </svg>
              <div className="bg-white dark:bg-gray-800 px-6 pb-6 pt-2 space-y-3">
                {(order.items || order.order_items || []).length === 0 ? (
                  <p className="text-gray-400 text-sm py-4 text-center">No items found.</p>
                ) : (
                  (order.items || order.order_items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3 border border-gray-100 dark:border-white/5"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-white/10 flex-shrink-0 flex items-center justify-center">
                        {item.menu_item_image ? (
                          <img
                            src={item.menu_item_image}
                            alt={item.menu_item_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full items-center justify-center text-3xl ${
                            item.menu_item_image ? 'hidden' : 'flex'
                          }`}
                        >
                          🍽️
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base md:text-lg font-black text-gray-900 dark:text-white truncate">
                          {item.menu_item_name || item.name || 'Item'}
                          {(item.quantity || 1) > 1 && (
                            <span className="ml-2 text-sm font-bold text-green-600 dark:text-green-400">
                              ({item.quantity})
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xl md:text-2xl font-black text-green-600 dark:text-green-400">
                            ₹{(toNum(item.price) * toNum(item.quantity || 1)).toFixed(2)}
                          </span>
                          <span className="px-3 py-0.5 rounded-full text-[11px] md:text-xs font-black uppercase border border-green-500/30 bg-green-500/15 text-green-600 dark:text-green-400">
                            {order.payment_method === 'COD' ? 'Paid on delivery' : 'Paid'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Grand Total
                  </span>
                  <span className="text-2xl md:text-3xl font-black text-green-600 dark:text-green-400">
                    ₹{toNum(order.total_amount ?? order.total).toFixed(2)}
                  </span>
                </div>

                {/* Payment + Address */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                      Payment
                    </p>
                    <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
                      {order.payment_method || 'Online'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                      Delivery to
                    </p>
                    <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white truncate">
                      {order.customer_address || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back action */}
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/orders')}
                className="bg-[#ff7961] hover:bg-[#ee6a52] text-white font-bold tracking-wide uppercase py-4 px-10 rounded-full shadow-lg shadow-[#ff7961]/30 transition-all active:scale-95 hover:shadow-xl hover:shadow-[#ff7961]/40"
              >
                Back to Orders
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
