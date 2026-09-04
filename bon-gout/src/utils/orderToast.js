import React from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle } from 'react-icons/fa';

export function showOrderConfirmedToast({ orderNumber, total, orderId, onTrack }) {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-sm w-full shadow-2xl rounded-3xl pointer-events-auto flex items-stretch overflow-hidden ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/10`}
        style={{
          animation: t.visible
            ? 'toastIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both'
            : 'toastOut 0.3s ease-in both',
        }}
      >
        <div className="w-2 bg-gradient-to-b from-orange-400 to-yellow-400 flex-shrink-0" />

        <div className="flex-1 p-4 pr-5">
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <FaCheckCircle className="w-6 h-6 text-white" />
              </div>
              <span
                className="absolute -right-1 -top-1 text-lg"
                style={{ animation: 'rocketBob 1.4s ease-in-out infinite' }}
                aria-hidden
              >
                🚀
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-orange-500 mb-0.5">
                Order Confirmed
              </p>
              <h4 className="text-[15px] font-black text-gray-900 dark:text-white leading-tight truncate">
                #{orderNumber || 'Order'} is on its way!
              </h4>
              {total != null && (
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                  Total · ₹{Number(total).toFixed(2)}
                </p>
              )}

              {onTrack && (
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    onTrack();
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#ff7961] to-[#ff9478] hover:from-[#ee6a52] hover:to-[#ee7f66] px-3 py-1.5 rounded-full shadow-md shadow-[#ff7961]/25 active:scale-95 transition-all"
                >
                  Track →
                </button>
              )}
            </div>

            <button
              onClick={() => toast.dismiss(t.id)}
              aria-label="Dismiss"
              className="w-7 h-7 -mr-1 -mt-1 flex-shrink-0 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    ),
    {
      duration: 5500,
      position: 'top-right',
      id: `order-${orderNumber || Date.now()}`,
    },
  );
}
