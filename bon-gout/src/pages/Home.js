/**
 * FILE: bon-gout/src/pages/Home.js
 * DESCRIPTION: The landing page of the application.
 * PROJECT PART: Frontend (Page)
 * INTERACTIONS: 
 * - Displays the 'Carousel' component.
 * - Fetches 'Featured Dishes' from the backend.
 * - Allows customers to quickly add items to their cart.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Carousel from '../components/Carousel';
import SkeletonCard from '../components/SkeletonCard';
import { getImageUrl, DEFAULT_FOOD_IMAGE } from '../utils/imageUtils';

export default function Home() {
  // HOOKS:
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { isLoggedIn, isUser, isAdmin, isEmployee } = useAuth(); // Extract auth states
  
  // STATE:
  const [menuItems, setMenuItems] = useState([]); // Stores the list of featured dishes.
  const [totalCount, setTotalCount] = useState(0); // Total number of dishes found.
  const [loading, setLoading] = useState(true); // Tracks if data is still fetching.
  
  /**
   * PURPOSE: Runs when the page loads.
   * API CALL: GET /api/restaurant/menu/?is_featured=true
   * EXPECTED RESPONSE: A list of dishes marked as 'featured' by the Admin.
   */
  useEffect(() => {
    const fetchFeaturedMenu = async () => {
      try {
        const response = await api.get('restaurant/menu/?is_featured=true');
        
        // INTERVIEW NOTE: We audit the response format to ensure it works 
        // with both raw arrays and standardized {status, message, data} objects.
        const apiData = response.data.data || response.data;
        const data = apiData.results || apiData;
        const count = apiData.count || (Array.isArray(data) ? data.length : 0);
        
        setTotalCount(count);
        setMenuItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch featured menu:", error);
      } finally {
        setLoading(false); // Stop showing the loading spinner.
      }
    };
    fetchFeaturedMenu();
  }, []);
  
  /**
   * PURPOSE: Adds a dish to the shopping cart.
   * ROLE RESTRICTION: Only 'Customers' and 'Guests' can see/click this. 
   * Staff/Admins are blocked to prevent accidental orders while managing the site.
   */
  const handleQuickAdd = (item) => {
    if (!isLoggedIn) {
      toast.error("Please login to add items to your cart! 🔐");
      navigate('/login');
      return;
    }
    
    if (isAdmin || isEmployee) {
      toast.error("Staff accounts cannot place orders! 🧑‍🍳");
      return;
    }

    addToCart(item);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white pt-24 pb-12 transition-colors duration-300">
      
      {/* 
          COMPONENT: Hero Carousel 
          PURPOSE: Visual eye-candy showing quotes and high-quality food images.
      */}
      <Carousel />

      {/* FEATURED DISHES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-5 py-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 animate-pulse"/>
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400 tracking-wide uppercase">Chef's Picks</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 bg-clip-text text-transparent mb-5 leading-tight">
            🍛 Featured Dishes
          </h2>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Our most popular flavors — hand-selected by our chefs, fresh, hot, and ready to order
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="relative rounded-[28px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-[0_18px_50px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(249,115,22,0.15)] transition-all duration-300 group flex flex-col h-full overflow-hidden"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    onError={(e) => { e.target.src = DEFAULT_FOOD_IMAGE; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent"/>
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-sm">
                    ⭐ {item.average_rating || 'New'}
                    {item.total_reviews > 0 && (
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">({item.total_reviews})</span>
                    )}
                  </div>
                  {item.is_spicy && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-1.5 rounded-full text-[11px] font-bold shadow-[0_8px_20px_rgba(239,68,68,0.35)]">
                      🌶️ Spicy
                    </div>
                  )}
                  <div className={`absolute top-14 left-3 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md ${
                    item.is_veg
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-[0_8px_20px_rgba(34,197,94,0.35)]'
                      : 'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-[0_8px_20px_rgba(180,83,9,0.35)]'
                  }`}>
                    {item.is_veg ? '🌿 Veg' : '🍗 Non-Veg'}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mb-2 line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">{item.description}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
                    <div>
                      <span className="text-xl font-black bg-gradient-to-r from-orange-600 to-yellow-500 bg-clip-text text-transparent">₹{item.price}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-medium">⏱️ {item.prep_time || '20min'}</span>
                    </div>
                  </div>

                  {(!isLoggedIn || isUser) && (
                    <button
                      onClick={() => handleQuickAdd(item)}
                      className="mt-4 w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-slate-900 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.97] shadow-[0_12px_28px_rgba(249,115,22,0.35)] hover:shadow-[0_16px_36px_rgba(249,115,22,0.45)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      <span>🛒</span>
                      <span>Add to Cart</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-16 md:mt-20">
          <Link
            to="/menu"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-slate-900 px-8 py-4 rounded-full font-black text-base shadow-[0_18px_45px_rgba(249,115,22,0.35)] hover:shadow-[0_22px_55px_rgba(249,115,22,0.45)] hover:scale-[1.03] transition-all duration-300"
          >
            <span>View All Dishes</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 md:mb-28">
        <div className="relative bg-gradient-to-br from-orange-500/10 via-yellow-500/5 to-orange-500/10 dark:from-orange-500/15 dark:via-yellow-500/10 dark:to-orange-500/15 backdrop-blur-xl rounded-[2rem] p-8 md:p-14 border border-orange-400/20 dark:border-orange-400/25 shadow-[0_30px_80px_rgba(249,115,22,0.08)] overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-orange-400/30 to-yellow-400/20 blur-3xl pointer-events-none"/>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-yellow-400/25 to-orange-400/20 blur-3xl pointer-events-none"/>
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 text-center">
            {[
              { val: `${totalCount || 8}+`, label: 'Menu Items', icon: '🍽️' },
              { val: '500+', label: 'Happy Foodies', icon: '❤️' },
              { val: '25+', label: 'Daily Orders', icon: '🚀' },
              { val: '4.9★', label: 'Avg Rating', icon: '⭐' },
            ].map((s, i) => (
              <div key={i} className="group relative space-y-3 p-4 rounded-3xl hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300">
                <div className="text-4xl mb-1 group-hover:scale-125 transition-transform duration-300">{s.icon}</div>
                <div className="text-3xl md:text-5xl font-black bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 bg-clip-text text-transparent tracking-tight">
                  {s.val}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-[0.18em]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 mb-20 md:mb-28">
        <div className="text-center mb-14 md:mb-20">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-5 py-2 mb-6">
            <span>💬</span>
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400 tracking-wide uppercase">Testimonials</span>
          </div>
          <h2 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 bg-clip-text text-transparent mb-5 leading-tight">
            What Our Foodies Say
          </h2>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Real stories from real customers who fell in love with Bon Gout
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { name: "Arjun Reddy", review: "The Mutton Dum Biryani is a masterpiece! Reminds me of the authentic Hyderabadi flavors my grandma used to make.", rating: 5, avatar: "👨‍🍳" },
            { name: "Priya Sharma", review: "Fastest delivery I've ever experienced. The food arrived piping hot and every dish was perfectly seasoned. Wow!", rating: 5, avatar: "👩" },
            { name: "Suresh Kumar", review: "Excellent service and the Double Ka Meetha is to die for. Ordering weekly now — Bon Gout never disappoints!", rating: 4, avatar: "👨" }
          ].map((t, idx) => (
            <div
              key={idx}
              className="relative bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-[0_18px_50px_rgba(15,23,42,0.06)] hover:border-orange-500/40 dark:hover:border-orange-500/40 hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(249,115,22,0.12)] transition-all duration-300 group"
            >
              <div className="absolute -top-4 -right-3 md:-top-5 md:-right-4 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 shadow-[0_12px_28px_rgba(249,115,22,0.4)] flex items-center justify-center text-white font-black text-2xl md:text-3xl group-hover:scale-110 group-hover:rotate-[-6deg] transition-transform duration-300">
                "
              </div>
              <div className="text-4xl mb-5">{t.avatar}</div>
              <div className="flex mb-4 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < t.rating ? '' : 'opacity-30 grayscale'}>⭐</span>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-[15px] md:text-lg leading-relaxed mb-6 min-h-[100px]">
                "{t.review}"
              </p>
              <div className="pt-5 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">{t.name}</h4>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500 mt-1">Verified Customer</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-12 md:py-20 px-4 mb-12">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-orange-500/10 via-yellow-500/8 to-orange-500/10 dark:from-orange-500/15 dark:via-yellow-500/12 dark:to-orange-500/15 backdrop-blur-xl rounded-[2.5rem] p-10 md:p-20 border border-orange-400/20 dark:border-orange-400/25 shadow-[0_40px_100px_rgba(249,115,22,0.1)] overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-orange-400/25 to-yellow-400/20 blur-3xl pointer-events-none"/>
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-gradient-to-tr from-yellow-400/20 to-orange-400/25 blur-3xl pointer-events-none"/>

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-sm border border-white/60 dark:border-white/20 rounded-full px-5 py-2 mb-7">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                <span className="text-sm font-bold text-slate-700 dark:text-gray-200 tracking-wide">Orders are live</span>
              </div>

              <h2 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 bg-clip-text text-transparent mb-6 md:mb-8 leading-tight">
                Ready to Order?
              </h2>
              <p className="text-lg md:text-2xl text-gray-700 dark:text-gray-200 mb-10 md:mb-14 max-w-2xl mx-auto leading-relaxed font-medium">
                Your favorite Hyderabadi dishes are just a click away — hot, fresh, and delivered in under 30 minutes
              </p>

              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
                <Link
                  to="/menu"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 border-2 border-gray-300 dark:border-white/20 hover:border-orange-500/60 text-slate-800 dark:text-white bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 backdrop-blur-sm px-8 md:px-10 py-4 md:py-5 rounded-full font-black text-base md:text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span>🍽️ Browse Menu</span>
                </Link>
                <Link
                  to={cartCount > 0 ? '/cart' : '/menu'}
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#ff7961] hover:bg-[#ff6853] text-white px-10 md:px-14 py-4 md:py-5 rounded-full font-black text-base md:text-lg shadow-[0_20px_50px_rgba(255,121,97,0.45)] hover:shadow-[0_26px_60px_rgba(255,121,97,0.55)] hover:scale-[1.03] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span>{cartCount > 0 ? 'Go to Checkout' : 'Start Ordering'}</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">{cartCount > 0 ? '💳' : '🚀'}</span>
                </Link>
              </div>

              {cartCount > 0 && (
                <p className="mt-6 text-sm font-semibold text-orange-600 dark:text-orange-400">
                  🛒 {cartCount} {cartCount === 1 ? 'item' : 'items'} waiting in your cart
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
