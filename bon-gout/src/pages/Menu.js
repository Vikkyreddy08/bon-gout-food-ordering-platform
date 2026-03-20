/**
 * FILE: bon-gout/src/pages/Menu.js
 * DESCRIPTION: The main menu catalog where users can browse and filter dishes.
 * PROJECT PART: Frontend (Page)
 * INTERACTIONS: 
 * - Fetches all dishes and categories from the backend.
 * - Allows users to filter by category (e.g. Starters, Drinks).
 * - Allows users to search for specific dish names.
 * - Integrates 'ReviewModal' for adding feedback.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SkeletonCard from '../components/SkeletonCard';
import { getImageUrl, DEFAULT_FOOD_IMAGE } from '../utils/imageUtils';

/**
 * COMPONENT: ReviewModal
 * PURPOSE: A popup form for users to rate and comment on a dish.
 * PROPS:
 * - isOpen: Boolean to show/hide.
 * - onClose: Function to close the popup.
 * - dish: The dish object being reviewed.
 * - onSubmit: Function to call the API.
 */
const ReviewModal = ({ isOpen, onClose, dish, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(dish.id, { rating, comment });
      onClose();
      setComment("");
      setRating(5);
    } catch (err) {
      // toast handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1a1c1e] rounded-3xl p-8 max-w-md w-full border border-gray-200 dark:border-white/10 shadow-2xl transition-colors duration-300">
        <h3 className="text-2xl font-black mb-6 text-gray-900 dark:text-white">Review {dish.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Rating</label>
            <div className="flex gap-2">
              {/* STAR RATING PICKER: [1,2,3,4,5] */}
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  className={`w-12 h-12 rounded-xl text-xl font-bold transition-all ${
                    rating >= num ? "bg-orange-500 text-black" : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500"
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="comment" className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Your Experience</label>
            <textarea
              id="comment"
              name="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              placeholder="How was the taste?..."
              className="w-full h-32 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 rounded-2xl font-black bg-gradient-to-r from-orange-500 to-yellow-500 text-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Submit 🚀"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * COMPONENT: MenuCard
 * PURPOSE: Displays a single dish card with image, price, and actions.
 * INTERVIEW NOTE: We use React.memo to prevent this card from re-rendering 
 * unless its specific 'item' data changes. This improves performance when 
 * filtering a long menu list.
 */
const MenuCard = React.memo(({ item, onAddToCart, onReviewClick, canReview, isUser }) => {
  const [showReviews, setShowReviews] = useState(false);

  return (
    <div className="rounded-2xl bg-white dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-4 md:p-6 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group flex flex-col h-full shadow-lg dark:shadow-none">
      {/* IMAGE CONTAINER */}
      <div className="relative h-40 md:h-48 overflow-hidden rounded-xl mb-4">
        <img 
          src={getImageUrl(item.image)} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          onError={(e) => { e.target.src = DEFAULT_FOOD_IMAGE; }}
        />
        {/* RATING BADGE */}
        <div className="absolute top-2 right-2 bg-black/60 text-white px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold backdrop-blur flex items-center gap-1">
          ⭐ {item.average_rating || "New"}
          {item.total_reviews > 0 && <span className="text-gray-400 font-normal">({item.total_reviews})</span>}
        </div>
        {item.is_spicy && (
          <div className="absolute top-2 left-2 bg-red-500/90 text-white px-2 py-1 rounded-full text-[10px] md:text-xs font-bold backdrop-blur">
            🌶️ Spicy
          </div>
        )}
        {item.is_veg && (
          <div className="absolute bottom-2 left-2 bg-green-500/90 text-white px-2 py-1 rounded-full text-[10px] md:text-xs font-bold backdrop-blur">
            🌿 Veg
          </div>
        )}
      </div>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg md:text-xl font-bold line-clamp-1 text-gray-900 dark:text-white">{item.name}</h3>
        <div className="flex gap-2">
          {canReview && (
            <button 
              onClick={() => onReviewClick(item)}
              className="text-[10px] md:text-xs text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-bold border-b border-orange-600/30 dark:border-orange-400/30"
            >
              Rate
            </button>
          )}
          {item.reviews && item.reviews.length > 0 && (
            <button 
              onClick={() => setShowReviews(!showReviews)}
              className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-bold border-b border-blue-600/30 dark:border-blue-400/30"
            >
              {showReviews ? "Hide" : "Reviews"}
            </button>
          )}
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-3 line-clamp-2 min-h-[2.5rem]">{item.description}</p>
      
      {/* Past Reviews Preview - TOGGLEABLE */}
      {showReviews && item.reviews && item.reviews.length > 0 && (
        <div className="mb-4 bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Latest Review</p>
          <p className="text-[10px] md:text-xs italic text-gray-700 dark:text-gray-300">"{item.reviews[0].comment}"</p>
          <p className="text-[10px] text-orange-600 dark:text-orange-500 font-bold mt-1">— {item.reviews[0].username}</p>
        </div>
      )}

      <div className="flex justify-between items-center mt-auto pt-2">
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">₹{item.price}</span>
          <span className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-tighter">⏱️ {item.prep_time || '20min'}</span>
        </div>
        {isUser && (
          <button 
            onClick={() => onAddToCart(item)} 
            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-sm md:text-base text-black shadow-lg hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300"
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
});

export default function Menu() {
  // CONTEXT HOOKS:
  const { addToCart } = useCart();
  const { isLoggedIn, user, isUser } = useAuth();
  
  // PAGE STATE:
  const [items, setItems] = useState([]); // All dishes from API
  const [categories, setCategories] = useState([]); // All categories from API
  const [loading, setLoading] = useState(true); // Fetching status
  const [activeCategory, setActiveCategory] = useState('All'); // Filter state
  const [searchQuery, setSearchQuery] = useState(""); // Search state
  const [reviewModal, setReviewModal] = useState({ isOpen: false, dish: null });

  /**
   * PURPOSE: Fetches both Menu and Categories in parallel on load.
   * API CALLS: 
   * - GET /api/restaurant/menu/
   * - GET /api/restaurant/categories/
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [menuRes, catRes] = await Promise.all([
          api.get('restaurant/menu/'),
          api.get('restaurant/categories/')
        ]);
        
        // The API response is nested under a 'data' object, which contains 'results'
        const menuData = menuRes.data?.data?.results;
        const catData = catRes.data?.data?.results;
        
        setItems(Array.isArray(menuData) ? menuData : []);
        setCategories(Array.isArray(catData) ? catData : []);
      } catch (err) {
        toast.error("Failed to load menu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /**
   * PURPOSE: Filters the menu items based on Search and Category.
   * LOGIC: 
   * 1. Check if name matches searchQuery.
   * 2. Check if category matches activeCategory.
   * 
   * INTERVIEW NOTE: We use useMemo to cache the filtered list. This prevents 
   * expensive re-filtering logic from running on every tiny UI change.
   */
  const filteredItems = useMemo(() => {
    // SECURITY: Ensure 'items' is an array before filtering.
    if (!Array.isArray(items)) return [];

    return items.filter(item => {
      // LOGIC: Robust null-safe filtering.
      const name = item?.name || "";
      const catName = item?.category_name || "";
      
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      
      // LOGIC: Case-insensitive category matching.
      const matchesCategory = activeCategory === 'All' || 
                             catName.toLowerCase() === activeCategory.toLowerCase();
      
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, activeCategory]);

  /**
   * PURPOSE: Sends a new review to the backend.
   * API CALL: POST /api/restaurant/menu/{id}/add_review/
   */
  const handleReviewSubmit = async (dishId, reviewData) => {
    try {
      await api.post(`menu/${dishId}/add_review/`, reviewData);
      toast.success("Thank you for your feedback! ⭐");
      
      // Refresh the menu to show the new average rating.
      const res = await api.get('menu/');
      setItems(res.data.data?.results || res.data.data || res.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to post review";
      toast.error(msg);
    }
  };

  /**
   * PURPOSE: Handles the "Add to Cart" button.
   * ROLE RESTRICTION: Only logged-in customers can order.
   */
  const handleAddToCart = useCallback((item) => {
    if (!isUser) {
      toast.error("Please login as a customer to order food!");
      return;
    }
    addToCart(item);
  }, [isUser, addToCart]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pt-24 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4">
              Our Menu
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400">Discover flavors crafted with passion</p>
          </div>
          
          {/* SEARCH BOX: Filters the items list in real-time. */}
          <div className="relative w-full md:w-96 group">
            <label htmlFor="search-menu" className="sr-only">Search menu items</label>
            <input
              id="search-menu"
              name="search-menu"
              type="text"
              placeholder="Search for your favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-gray-900 dark:text-white"
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl group-focus-within:scale-110 transition-transform">🔍</span>
          </div>
        </div>

        {/* CATEGORY FILTER BAR */}
        <div className="flex overflow-x-auto pb-6 mb-12 gap-4 no-scrollbar">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-8 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
              activeCategory === 'All' 
                ? 'bg-orange-500 text-black shadow-xl scale-105' 
                : 'bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'
            }`}
          >
            All Items
          </button>
          {/* LOOP: Creates a button for every category returned by the API. */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-8 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.name 
                  ? 'bg-orange-500 text-black shadow-xl scale-105' 
                  : 'bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Conditional Rendering: Loading vs. Content vs. Empty */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredItems.map((item) => (
              <MenuCard 
                key={item.id} 
                item={item} 
                onAddToCart={handleAddToCart}
                onReviewClick={(dish) => setReviewModal({ isOpen: true, dish })}
                isUser={isUser}
                canReview={isUser}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-gray-50 dark:bg-white/5 rounded-4xl border border-dashed border-gray-300 dark:border-white/10 animate-in fade-in zoom-in duration-500">
            <div className="text-8xl mb-8">🏜️</div>
            <h3 className="text-3xl font-black text-gray-400 mb-4">No dishes found matching your criteria.</h3>
            <p className="text-gray-500 mb-10 max-w-md mx-auto font-medium">Try adjusting your search or category filters to find what you're looking for.</p>
            <button 
              onClick={() => {setSearchQuery(""); setActiveCategory('All');}} 
              className="bg-orange-500 hover:bg-orange-600 text-black px-10 py-4 rounded-2xl font-black shadow-xl shadow-orange-500/20 transition-all active:scale-95"
            >
              Reset All Filters 🔄
            </button>
          </div>
        )}
      </div>

      {/* POPUP: Hidden by default, appears when 'Review' button is clicked. */}
      {reviewModal.isOpen && (
        <ReviewModal 
          isOpen={reviewModal.isOpen}
          dish={reviewModal.dish}
          onClose={() => setReviewModal({ isOpen: false, dish: null })}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}
