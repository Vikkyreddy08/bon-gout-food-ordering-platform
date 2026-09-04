import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function OrderSuccessModal({
  isOpen,
  onClose,
  order,
  orderId,
  orderNumber,
  totalAmount,
  items,
  customerEmail,
  customerAddress,
}) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const finalOrderId = orderId ?? order?.id;
  const finalOrderNumber = orderNumber ?? order?.order_number ?? '—';
  const finalTotal = totalAmount ?? order?.total_amount ?? order?.total ?? '0.00';
  const finalItems = items ?? order?.items ?? order?.order_items ?? [];
  const finalEmail = customerEmail ?? order?.customer_email;
  const finalAddress = customerAddress ?? order?.customer_address ?? '—';

  const primaryItem = finalItems[0];
  const itemName = primaryItem?.menu_item_name || primaryItem?.name || 'Your order';
  const itemImage = primaryItem?.menu_item_image || primaryItem?.image;
  const itemDescExtra = primaryItem?.desc || primaryItem?.description
    ? ` · ${primaryItem.desc || primaryItem.description}`
    : finalItems.length > 1
      ? ` · +${finalItems.length - 1} more`
      : '';
  const itemPrice = primaryItem
    ? (toNum(primaryItem.price) * toNum(primaryItem.quantity || 1))
    : toNum(finalTotal);

  const estDate = new Date();
  estDate.setMinutes(estDate.getMinutes() + 45);
  const estDelivery = estDate.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).replace(',', ';');

  const handleTrackOrder = () => {
    onClose && onClose();
    if (finalOrderId) {
      navigate(`/orders/${finalOrderId}`);
    } else {
      navigate('/orders');
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose && onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleBackdrop}
    >
      <div className="relative w-full max-w-[440px] bg-white dark:bg-gray-800 rounded-[40px] shadow-[0_40px_120px_rgba(0,0,0,0.25)] p-8 md:p-10 animate-in zoom-in-95 slide-in-from-bottom-6 duration-400">
        <button
          type="button"
          onClick={() => onClose && onClose()}
          aria-label="Close modal"
          className="absolute right-5 top-5 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <FaTimes size={16} />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* ===== Scooter illustration (per reference UI) ===== */}
          <div className="relative mb-8">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-100 to-emerald-200/80 dark:from-green-500/20 dark:to-emerald-500/10 flex items-center justify-center" />
            <div className="absolute inset-0 flex items-center justify-center animate-scooter">
              <svg viewBox="0 0 160 160" className="w-40 h-40" aria-hidden>
                <g>
                  {/* Rear wheel */}
                  <circle cx="50" cy="125" r="17" fill="#111827" />
                  <circle cx="50" cy="125" r="9" fill="#9ca3af" />
                  <circle cx="50" cy="125" r="3" fill="#111827" />
                  {/* Front wheel */}
                  <circle cx="122" cy="125" r="17" fill="#111827" />
                  <circle cx="122" cy="125" r="9" fill="#9ca3af" />
                  <circle cx="122" cy="125" r="3" fill="#111827" />
                  {/* Scooter body - orange */}
                  <path d="M56 110 Q64 80 88 76 Q108 74 116 92 L118 112 Q118 118 112 118 L60 118 Q52 118 54 110 Z" fill="#fb923c" />
                  {/* Footboard */}
                  <rect x="62" y="112" width="52" height="6" rx="3" fill="#f97316" />
                  {/* Handlebar stem */}
                  <rect x="108" y="56" width="6" height="38" rx="3" fill="#111827" />
                  {/* Handlebar */}
                  <rect x="96" y="50" width="30" height="6" rx="3" fill="#111827" />
                  {/* Headlight */}
                  <circle cx="124" cy="96" r="4" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
                  {/* Delivery box (red) */}
                  <rect x="22" y="62" width="48" height="48" rx="6" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
                  {/* Box lid */}
                  <rect x="20" y="58" width="52" height="8" rx="3" fill="#dc2626" />
                  {/* Box clock icon */}
                  <circle cx="46" cy="86" r="10" fill="#fff7ed" />
                  <path d="M46 80 V86 L50 88" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" fill="none" />
                  {/* Rider body (red shirt) */}
                  <circle cx="90" cy="60" r="15" fill="#ef4444" />
                  {/* Rider arms */}
                  <path d="M78 56 Q72 62 74 72" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" fill="none" />
                  <path d="M102 56 Q110 56 114 54" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" fill="none" />
                  {/* Rider head */}
                  <circle cx="90" cy="38" r="12" fill="#fde68a" />
                  {/* Rider helmet (red) */}
                  <path d="M77 36 Q77 22 90 22 Q103 22 103 36 Z" fill="#dc2626" />
                  <rect x="76" y="34" width="28" height="4" rx="2" fill="#b91c1c" />
                  {/* Helmet visor */}
                  <rect x="82" y="36" width="16" height="6" rx="2" fill="#1f2937" opacity="0.85" />
                  {/* Rider face mask */}
                  <rect x="82" y="40" width="16" height="5" rx="2" fill="#93c5fd" />
                </g>
              </svg>
            </div>
            {/* Little sparkles */}
            <span className="absolute -top-1 -left-3 text-yellow-400 text-xl animate-pulse">✨</span>
            <span className="absolute -bottom-2 -right-4 text-orange-400 text-lg animate-pulse">✨</span>
          </div>

          {/* ===== Heading ===== */}
          <h2 className="text-[30px] md:text-[34px] font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            Order Status
          </h2>
          <p className="mt-2 text-[17px] md:text-lg text-gray-500 dark:text-gray-400 font-medium">
            Your package is on the way
          </p>

          {/* ===== Item card ===== */}
          <div className="mt-7 w-full rounded-3xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-white/5 p-4 flex items-center gap-4">
            <div className="w-16 h-16 md:w-18 md:h-18 flex-shrink-0 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 overflow-hidden flex items-center justify-center">
              {itemImage ? (
                <img
                  src={itemImage}
                  alt={itemName}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div className={`${itemImage ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-3xl`}>🍽️</div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold text-gray-400 dark:text-gray-500">
                {finalItems.length > 1 ? `${finalItems.length} items` : 'Order'}
              </p>
              <h4 className="mt-0.5 text-base md:text-lg font-black text-gray-900 dark:text-white truncate">
                {itemName}
              </h4>
              <p className="mt-0.5 text-sm font-semibold text-gray-500 dark:text-gray-400">
                {primaryItem && (primaryItem.quantity || 1) > 1
                  ? `Qty: ${primaryItem.quantity || 1}${itemDescExtra}`
                  : itemDescExtra || 'Bon Gout kitchen'}
              </p>
            </div>
            <div className="text-right flex-shrink-0 pl-2">
              <p className="text-lg md:text-xl font-black text-gray-900 dark:text-white">
                ₹{itemPrice.toFixed(2)}
              </p>
            </div>
          </div>

          {/* ===== Order Summary card ===== */}
          <div className="mt-5 w-full rounded-3xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="px-5 pt-4 pb-3 text-left">
              <h5 className="text-base md:text-lg font-black text-gray-900 dark:text-white">
                Order Summary
              </h5>
            </div>
            <div className="border-t border-gray-200/80 dark:border-white/5 px-5 py-4 space-y-3 text-left">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm md:text-[15px] font-semibold text-gray-500 dark:text-gray-400">
                  Order ID
                </span>
                <span className="text-sm md:text-[15px] font-black text-gray-900 dark:text-white truncate">
                  {finalOrderNumber}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm md:text-[15px] font-semibold text-gray-500 dark:text-gray-400">
                  Shipping Address
                </span>
                <span className="text-sm md:text-[15px] font-bold text-gray-900 dark:text-white text-right line-clamp-2 max-w-[60%]">
                  {finalAddress}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm md:text-[15px] font-semibold text-gray-500 dark:text-gray-400">
                  Tracking ID
                </span>
                <span className="text-sm md:text-[15px] font-black text-gray-900 dark:text-white truncate">
                  {finalOrderNumber}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm md:text-[15px] font-semibold text-gray-500 dark:text-gray-400">
                  Estimated Delivery
                </span>
                <span className="text-sm md:text-[15px] font-black text-gray-900 dark:text-white">
                  {estDelivery}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-2 mt-2 border-t border-gray-200/70 dark:border-white/5">
                <span className="text-sm md:text-[15px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                  Grand Total
                </span>
                <span className="text-lg md:text-xl font-black text-[#ff7961]">
                  ₹{toNum(finalTotal).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ===== Track Order button (black pill, per reference UI) ===== */}
          <button
            onClick={handleTrackOrder}
            className="mt-8 w-full md:w-auto md:min-w-[280px] bg-[#111827] hover:bg-black dark:bg-white dark:text-[#111827] dark:hover:bg-gray-100 text-white font-bold tracking-wide py-4.5 px-10 rounded-full shadow-[0_14px_36px_rgba(17,24,39,0.25)] dark:shadow-white/10 transition-all duration-300 active:scale-[0.97] hover:shadow-[0_18px_44px_rgba(17,24,39,0.35)] text-[15px] md:text-base"
          >
            Track order
          </button>

          {/* ===== Green confirmation line ===== */}
          <p className="mt-4 text-[13px] md:text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Your order is confirmed and in transit
          </p>

          {/* Email receipt confirmation */}
          {finalEmail && (
            <p className="mt-2 text-[11px] md:text-xs text-gray-400 dark:text-gray-500 text-center max-w-xs">
              A receipt has been emailed to <span className="font-semibold text-gray-500 dark:text-gray-400">{finalEmail}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
