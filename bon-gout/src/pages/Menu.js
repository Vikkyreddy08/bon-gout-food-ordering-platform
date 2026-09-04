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
import { Link, useNavigate } from 'react-router-dom';
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
const MenuCard = React.memo(({ item, onAddToCart, onReviewClick, canReview, isUser, isLoggedIn }) => {
  const [showReviews, setShowReviews] = useState(false);

  return (
    <div className="relative rounded-[28px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-[0_18px_50px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full overflow-hidden">
      {/* IMAGE CONTAINER */}
      <div className="relative h-40 overflow-hidden">
        <img 
          src={getImageUrl(item.image)} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
          onError={(e) => { e.target.src = DEFAULT_FOOD_IMAGE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-md">
          ⭐ {item.average_rating || "New"}
          {item.total_reviews > 0 && <span className="text-gray-500 dark:text-gray-400">({item.total_reviews})</span>}
        </div>
        {item.is_spicy && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-[11px] font-semibold shadow-md">
            🌶️ Spicy
          </div>
        )}
        {item.is_veg && (
          <div className="absolute top-14 left-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-[11px] font-semibold shadow-md">
            🌿 Veg
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{item.name}</h3>
          <div className="flex gap-2">
            {canReview && (
              <button 
                onClick={() => onReviewClick(item)}
                className="text-[11px] text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-semibold"
              >
                Rate
              </button>
            )}
            {item.reviews && item.reviews.length > 0 && (
              <button 
                onClick={() => setShowReviews(!showReviews)}
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 font-semibold"
              >
                {showReviews ? "Hide" : "Reviews"}
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">{item.description}</p>
        
        {/* Past Reviews Preview - TOGGLEABLE */}
        {showReviews && item.reviews && item.reviews.length > 0 && (
          <div className="mb-4 bg-gray-50 dark:bg-slate-800 rounded-3xl p-3 border border-gray-100 dark:border-gray-700">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 font-bold mb-2">Latest review</p>
            <p className="text-sm italic text-slate-700 dark:text-gray-300">"{item.reviews[0].comment}"</p>
            <p className="mt-2 text-[11px] text-orange-600 dark:text-orange-400 font-semibold">— {item.reviews[0].username}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
          <div>
            <span className="text-xl font-black text-orange-600 dark:text-orange-400">₹{item.price}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">⏱️ {item.prep_time || '20min'}</span>
          </div>
          {(!isLoggedIn || isUser) && (
            <button 
              onClick={() => onAddToCart(item)} 
              className="btn-primary whitespace-nowrap py-2 px-4 text-sm"
            >
              Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default function Menu() {
  // CONTEXT HOOKS:
  const { addToCart } = useCart();
  const { isLoggedIn, user, isUser, isAdmin, isEmployee } = useAuth();
  const navigate = useNavigate();
  
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
        
        // INTERVIEW NOTE: We audit the response format to ensure it works 
        // with both raw arrays and standardized {status, message, data} objects.
        const menuApiData = menuRes.data?.data || menuRes.data;
        const catApiData = catRes.data?.data || catRes.data;

        const menuData = menuApiData.results || menuApiData;
        const catData = catApiData.results || catApiData;
        
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
   * ROLE RESTRICTION: Only 'Customers' and 'Guests' can add items.
   */
  const handleAddToCart = useCallback((item) => {
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
  }, [isLoggedIn, isAdmin, isEmployee, addToCart, navigate]);

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

        {/* CATEGORY FILTER BAR - Modern Pill Card Style */}
        <div className="mb-12">
          <div
            className="flex gap-3 md:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style>{`
              .cat-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
            `}</style>
            <div className="cat-scroll flex gap-3 md:gap-4 w-full">
              {/* ALL ITEMS CARD */}
              <button
                type="button"
                onClick={() => setActiveCategory('All')}
                className={`group relative flex flex-col items-center justify-center gap-2 flex-shrink-0 w-20 h-24 sm:w-24 sm:h-28 md:w-28 md:h-32 rounded-3xl border transition-all duration-300 ease-out active:scale-95 ${
                  activeCategory === 'All'
                    ? 'bg-gradient-to-br from-orange-500 to-yellow-500 text-white border-transparent shadow-2xl shadow-orange-500/30 scale-105'
                    : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-white/10 shadow-[0_4px_20px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.10)] hover:border-orange-300/60 dark:hover:border-orange-400/30 hover:-translate-y-0.5'
                }`}
              >
                <span
                  className={`text-3xl sm:text-4xl md:text-5xl leading-none transition-transform duration-300 group-active:scale-90 ${
                    activeCategory === 'All' ? 'drop-shadow-sm' : 'group-hover:scale-110'
                  }`}
                >
                  🍽️
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-black tracking-tight whitespace-nowrap ${
                    activeCategory === 'All' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  All Items
                </span>
                {activeCategory === 'All' && (
                  <span className="absolute -bottom-1.5 w-10 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 shadow-md shadow-orange-500/40" />
                )}
              </button>

              {/* LOOP: Creates a pill-card button for every category returned by the API. */}
              {(() => {
                const getIcon = (name) => {
                  if (!name) return '🍴';
                  const n = name.toString().toLowerCase();
                  const iconMap = [
                    { rx: /all|everything|menu/, i: '🍽️' },
                    { rx: /starters?|appetizers?|entrees?|snacks?/, i: '🥗' },
                    { rx: /main\s*course|mains|entree/, i: '🍛' },
                    { rx: /biryani|biriyani|pulao|rice|pilaf/, i: '🍚' },
                    { rx: /pizza/, i: '🍕' },
                    { rx: /burger|sandwich|sub|wrap|roll/, i: '🍔' },
                    { rx: /pasta|noodle|spaghetti|macaroni|lasagna/, i: '🍝' },
                    { rx: /chicken|tandoori|grill|kebab|kabab|tikka/, i: '🍗' },
                    { rx: /seafood|fish|prawn|shrimp|crab/, i: '🦐' },
                    { rx: /mutton|beef|steak|meat|lamb/, i: '🥩' },
                    { rx: /veg.*thali|thali|combo|meal/, i: '🥘' },
                    { rx: /south\s*indian|dosa|idli|vada|uttapam/, i: '🥞' },
                    { rx: /north\s*indian|punjabi|curry|dal/, i: '🍲' },
                    { rx: /chinese|asian|noodle|soup|dim.?sum/, i: '🥡' },
                    { rx: /italian|taco|mexican|fajita|quesadilla/, i: '🌮' },
                    { rx: /dessert|sweet|cake|pastry|mousse/, i: '🍰' },
                    { rx: /ice\s*cream|sundae|gelato|kulfi/, i: '🍨' },
                    { rx: /bakery|bread|bun|pastry|croissant/, i: '🥐' },
                    { rx: /drinks?|beverages?|juice|shake|lassi|mocktail/, i: '🥤' },
                    { rx: /coffee|cafe|espresso|latte|mocha|cappuccino/, i: '☕' },
                    { rx: /tea|chai/, i: '🍵' },
                    { rx: /cocktail|alcohol|wine|beer|whiskey|vodka/, i: '🍹' },
                    { rx: /fruit|salad|greens|healthy/, i: '🥙' },
                    { rx: /fries|french\s*fries|chips|finger/, i: '🍟' },
                    { rx: /bread|naan|roti|paratha|chapati|kulcha/, i: '🫓' },
                    { rx: /soup/, i: '🍜' },
                    { rx: /sushi|japanese|ramen/, i: '🍣' },
                  ];
                  const hit = iconMap.find((m) => m.rx.test(n));
                  return hit ? hit.i : '🍴';
                };

                return categories.map((cat) => {
                  const isActive = activeCategory === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.name)}
                      className={`group relative flex flex-col items-center justify-center gap-2 flex-shrink-0 w-20 h-24 sm:w-24 sm:h-28 md:w-28 md:h-32 rounded-3xl border transition-all duration-300 ease-out active:scale-95 ${
                        isActive
                          ? 'bg-gradient-to-br from-orange-500 to-yellow-500 text-white border-transparent shadow-2xl shadow-orange-500/30 scale-105'
                          : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-white/10 shadow-[0_4px_20px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.10)] hover:border-orange-300/60 dark:hover:border-orange-400/30 hover:-translate-y-0.5'
                      }`}
                    >
                      <span
                        className={`text-3xl sm:text-4xl md:text-5xl leading-none transition-transform duration-300 group-active:scale-90 ${
                          isActive ? 'drop-shadow-sm' : 'group-hover:scale-110'
                        }`}
                      >
                        {getIcon(cat.name)}
                      </span>
                      <span
                        className={`text-[11px] sm:text-xs font-black tracking-tight whitespace-nowrap ${
                          isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {cat.name}
                      </span>
                      {isActive && (
                        <span className="absolute -bottom-1.5 w-10 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 shadow-md shadow-orange-500/40" />
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Conditional Rendering: Loading vs. Content vs. Empty */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredItems.map((item) => (
              <MenuCard 
                key={item.id} 
                item={item} 
                onAddToCart={handleAddToCart}
                onReviewClick={(dish) => setReviewModal({ isOpen: true, dish })}
                isUser={isUser}
                isLoggedIn={isLoggedIn}
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
