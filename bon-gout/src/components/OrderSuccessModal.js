/**
 * FILE: bon-gout/src/components/OrderSuccessModal.js
 * DESCRIPTION: Reusable order-placed confirmation modal matching the reference design.
 *  - Soft rounded-2xl white card
 *  - Inline SVG food illustration (bowl+chopsticks+coffee cup) with pastel sparkles
 *  - "You have successfully placed your order" heading
 *  - Large pill VIEW ORDER button (coral-orange)
 *  - (Bonus) Keeps order_number / total / items summary below the hero for context
 *  - X close button top-right
 */

import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function OrderSuccessModal({
  isOpen,
  onClose,
  order,
  orderId,
  orderNumber,
  totalAmount,
  items,
  customerEmail,
}) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const finalOrderId = orderId ?? order?.id;
  const finalOrderNumber = orderNumber ?? order?.order_number ?? '—';
  const finalTotal = totalAmount ?? order?.total_amount ?? '0.00';
  const finalItems = items ?? order?.items ?? [];
  const finalEmail = customerEmail ?? order?.customer_email;

  const handleViewOrder = () => {
    onClose && onClose();
    if (finalOrderId) {
      navigate(`/orders/${finalOrderId}`);
    } else {
      navigate('/orders');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-[480px] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-10 animate-in zoom-in-95 duration-300">
        {/* Close (X) */}
        <button
          type="button"
          onClick={() => onClose && onClose()}
          aria-label="Close modal"
          className="absolute right-5 top-5 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <FaTimes size={16} />
        </button>

        <div className="flex flex-col items-center text-center gap-6">
          {/* Food Illustration + Sparkles */}
          <div className="relative w-48 h-44 flex items-center justify-center">
            {/* Pastel sparkles (scattered around the illustration) */}
            <span className="absolute top-2 left-10 w-2 h-2 rounded-full bg-pink-200 opacity-80" />
            <span className="absolute top-6 left-3 w-1.5 h-1.5 rounded-full bg-yellow-200 opacity-90" />
            <span className="absolute top-0 right-12 w-3 h-3 rounded-full bg-orange-200/70" />
            <span className="absolute top-10 right-2 w-2 h-2 rounded-full bg-green-200/80" />
            <span className="absolute bottom-12 left-0 w-1.5 h-1.5 rounded-full bg-green-200/80" />
            <span className="absolute bottom-6 right-6 w-2.5 h-2.5 rounded-full bg-pink-200/80" />
            <span className="absolute bottom-2 left-20 w-2 h-2 rounded-full bg-yellow-200/90" />

            <svg viewBox="0 0 260 180" className="w-full h-full text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {/* Base shelf line */}
              <path d="M20 155 L240 155" strokeOpacity="0.4" />
              <path d="M32 155 L32 163 M52 155 L52 161 M210 155 L210 163 M230 155 L230 161" strokeOpacity="0.4" />

              {/* Bowl (left) */}
              <path d="M40 105 Q40 150 95 152 Q150 150 150 105 L40 105 Z" />
              <path d="M45 105 L145 105" />
              <path d="M60 120 Q70 138 90 140" strokeOpacity="0.7" />
              <path d="M56 126 Q62 134 70 136" strokeOpacity="0.7" />

              {/* Chopsticks */}
              <path d="M70 40 L105 95" />
              <path d="M82 35 L120 95" />

              {/* Steam */}
              <path d="M108 52 Q100 60 108 70 Q116 78 108 88" strokeOpacity="0.7" />
              <path d="M125 50 Q117 60 125 70 Q133 78 125 88" strokeOpacity="0.7" />

              {/* Coffee cup (right) */}
              <path d="M148 62 L200 62 L197 142 Q196 152 186 152 L162 152 Q152 152 151 142 Z" />
              {/* Cup lid */}
              <path d="M144 62 L204 62 L204 54 Q204 46 196 46 L152 46 Q144 46 144 54 Z" />
              <path d="M162 50 L186 50" strokeOpacity="0.7" />
              {/* Cup logo circle */}
              <circle cx="174" cy="105" r="13" strokeWidth="2.5" />
              {/* Cup handle */}
              <path d="M200 82 Q218 82 218 102 Q218 122 200 122" strokeWidth="2.5" />
            </svg>
          </div>

          {/* Success Text */}
          <div>
            <h2 className="text-2xl md:text-[26px] font-semibold text-gray-700 dark:text-gray-100 leading-snug">
              You have successfully placed your order
            </h2>
            {finalOrderNumber && finalOrderNumber !== '—' && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                Order #{finalOrderNumber}
              </p>
            )}
          </div>

          {/* VIEW ORDER pill button (coral-orange, large pill) */}
          <button
            onClick={handleViewOrder}
            className="mt-2 w-full md:w-auto md:min-w-[240px] bg-[#ff7961] hover:bg-[#ee6a52] text-white font-bold tracking-wide uppercase py-[18px] md:py-5 px-10 rounded-full shadow-lg shadow-[#ff7961]/30 transition-all active:scale-95 hover:shadow-xl hover:shadow-[#ff7961]/40"
          >
            View Order
          </button>

          {/* Bonus section: Summary (hidden by default? No — visible, helpful context) */}
          {finalItems.length > 0 && (
            <div className="mt-4 w-full border-t border-gray-100 dark:border-gray-700 pt-6 text-left space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[11px]">Total</span>
                <span className="text-xl font-black text-[#ff7961]">₹{Number(finalTotal).toFixed(2)}</span>
              </div>
              <ul className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {finalItems.map((it, idx) => (
                  <li key={idx} className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span className="truncate mr-2">{it.name || it.menu_item_name} × {it.quantity}</span>
                    <span className="font-semibold">₹{((it.price || 0) * (it.quantity || 1)).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              {finalEmail && (
                <p className="pt-2 text-xs text-gray-400 dark:text-gray-500 text-center">
                  A confirmation email has been sent to {finalEmail}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
