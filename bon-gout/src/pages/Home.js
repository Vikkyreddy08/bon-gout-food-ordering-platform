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
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Carousel from '../components/Carousel';
import SkeletonCard from '../components/SkeletonCard';
import { getImageUrl, DEFAULT_FOOD_IMAGE } from '../utils/imageUtils';

export default function Home() {
  // HOOKS:
  const { addToCart, cartCount } = useCart();
  const { isUser } = useAuth(); // Check if the logged-in person is a customer.
  
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
   * ROLE RESTRICTION: Only 'Customers' can add items. 
   * Staff/Admins are blocked to prevent accidental orders while managing the site.
   */
  const handleQuickAdd = (item) => {
    if (!isUser) {
      toast.error("Only customers can place orders! 🍽️");
      return;
    }
    addToCart(item);
    // Success notification appears at the top of the screen.
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white pt-24 pb-12 transition-colors duration-300">
      
      {/* 
          COMPONENT: Hero Carousel 
          PURPOSE: Visual eye-candy showing quotes and high-quality food images.
      */}
      <Carousel />

      {/* FEATURED DISHES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-6">
            🍛 Featured Dishes
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Our most popular flavors - fresh, hot, and ready to order
          </p>
        </div>

        {/* LOADING STATE: Shows a pulse animation while waiting for the API. */}
        {loading ? (
          <div className="text-center text-gray-400 py-20 text-2xl animate-pulse">Loading deliciousness... 👨‍🍳</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {/* 
                LOOP: .map() through the menuItems array.
                ANALOGY: Like walking past a buffet line and looking at each dish.
            */}
            {menuItems.map((item) => (
              <div key={item.id} className="group bg-gray-50 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 hover:border-orange-500/30 dark:hover:border-orange-400/50 hover:bg-white dark:hover:bg-white/10 hover:-translate-y-2 transition-all duration-300 shadow-lg dark:shadow-xl hover:shadow-2xl">
                
                {/* DISH IMAGE with badges for Spicy/Veg status */}
                <div className="relative overflow-hidden rounded-2xl h-48 mb-4">
                  <img 
                    src={getImageUrl(item.image)} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.target.src = DEFAULT_FOOD_IMAGE; }}
                  />
                  {item.is_spicy && (
                    <div className="absolute top-3 right-3 bg-red-500/95 text-white px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg">
                      🌶️ Spicy
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-green-500/95 text-white px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg">
                    {item.is_veg ? '🌿 Veg' : '🍗 Non-Veg'}
                  </div>
                </div>
                
                {/* DISH DETAILS: Name, Description, Price */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>⏱️ {item.prep_time || '20min'}</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">₹{item.price}</span>
                  </div>
                  
                  {/* QUICK ACTION BUTTON: Only visible to Customers. */}
                  {isUser && (
                    <button
                      onClick={() => handleQuickAdd(item)}
                      className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-black py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg"
                    >
                      Quick Add 🛒
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-center mt-16">
          <Link to="/menu" className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-bold text-lg border-b-2 border-orange-500/20 dark:border-orange-400/30 pb-2 transition-all">
            View All Dishes →
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-12 mx-4 md:mx-8 lg:mx-32 mb-24 border border-gray-200 dark:border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
          <div className="space-y-2 md:space-y-3">
            <div className="text-3xl md:text-5xl font-black text-orange-500">{totalCount || 8}</div>
            <div className="text-sm md:text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Menu Items</div>
          </div>
          <div className="space-y-2 md:space-y-3">
            <div className="text-3xl md:text-5xl font-black text-orange-500">500+</div>
            <div className="text-sm md:text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Customers</div>
          </div>
          <div className="space-y-2 md:space-y-3">
            <div className="text-3xl md:text-5xl font-black text-orange-500">25+</div>
            <div className="text-sm md:text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Daily Orders</div>
          </div>
          <div className="space-y-2 md:space-y-3">
            <div className="text-3xl md:text-5xl font-black text-orange-500">5★</div>
            <div className="text-sm md:text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Rating</div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 mb-24">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4 md:mb-6">
            What Our Foodies Say 💬
          </h2>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Real stories from real customers who fell in love with Bon Gout
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { name: "Arjun Reddy", review: "The Mutton Dum Biryani is a masterpiece! Reminds me of the authentic flavors.", rating: 5, avatar: "👨" },
            { name: "Priya Sharma", review: "Fastest delivery I've ever experienced. The food arrived piping hot and fresh.", rating: 5, avatar: "👩" },
            { name: "Suresh Kumar", review: "Excellent service and the Double Ka Meetha is to die for. Ordering again!", rating: 4, avatar: "👨" }
          ].map((t, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl md:rounded-4xl border border-gray-200 dark:border-white/10 hover:border-orange-500/20 dark:hover:border-orange-500/30 transition-all duration-300 relative group">
              <div className="text-3xl md:text-4xl mb-4 md:mb-6">{t.avatar}</div>
              <div className="flex text-orange-500 mb-3 md:mb-4">
                {[...Array(t.rating)].map((_, i) => <span key={i}>⭐</span>)}
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg italic leading-relaxed mb-4 md:mb-6">"{t.review}"</p>
              <h4 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{t.name}</h4>
              <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-10 h-10 md:w-12 md:h-12 bg-orange-500/10 dark:bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500 font-black text-xl md:text-2xl group-hover:scale-125 transition-transform">
                "
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-12 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-orange-500/5 dark:from-orange-500/10 to-yellow-500/5 dark:to-yellow-500/10 backdrop-blur-xl rounded-3xl p-8 md:p-20 border border-orange-400/20 dark:border-orange-400/30">
            <h2 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent mb-6 md:mb-8">
              Ready to Order?
            </h2>
            <p className="text-lg md:text-2xl text-gray-700 dark:text-gray-200 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              Your favorite Hyderabadi dishes are waiting in your cart
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
              <Link to="/cart" className="group w-full sm:w-auto bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-lg md:text-xl shadow-3xl hover:shadow-4xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3">
                <span>Go to Checkout 💳</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
