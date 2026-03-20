/**
 * FILE: bon-gout/src/pages/Orders.js
 * DESCRIPTION: The order history and tracking page for Customers and Staff.
 * PROJECT PART: Frontend (Page)
 * INTERACTIONS: 
 * - Fetches orders from the backend.
 * - Displays personal history for Customers.
 * - Displays ALL restaurant orders for Staff/Admins.
 * - Allows Staff to advance order status (e.g. Pending -> Preparing).
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Orders() {
  // CONTEXT:
  const { user, isLoggedIn, token, isAdmin, isEmployee } = useAuth();
  
  // STATE:
  const [orders, setOrders] = useState([]); // List of formatted order objects.
  const [loading, setLoading] = useState(true); // Fetching status.
  const [filter, setFilter] = useState('all'); // Filter state (e.g. 'pending', 'delivered').
  
  const location = useLocation();
  const newOrder = location.state?.newOrder;
  const showSuccess = location.state?.showSuccess;

  /**
   * PURPOSE: Fetches orders on load.
   * RUNS: When login status or token changes.
   */
  useEffect(() => {
    if (isLoggedIn && token) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, token]);

  /**
   * PURPOSE: Calls the API to get the order list.
   * API CALL: GET /api/restaurant/orders/
   * ROLE LOGIC (BACKEND): 
   * - Backend automatically filters based on the JWT token.
   * - User gets their own orders.
   * - Staff gets EVERYONE'S orders.
   */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('restaurant/orders/');
      
      // INTERVIEW NOTE: We audit the response to handle both paginated results 
      // and simple arrays, ensuring the UI doesn't crash if data format changes.
      const apiData = response.data.data || response.data;
      const data = apiData.results || apiData;
      
      if (!data || !Array.isArray(data)) {
        setOrders([]);
        return;
      }
      
      // FORMATTING: Convert raw backend data into user-friendly UI objects.
      const formattedOrders = data.map(order => ({
        id: order.id,
        order_number: order.order_number,
        // Convert ISO date string to a readable Indian format.
        date: new Date(order.created_at || order.date).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        items: order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
        total: parseFloat(order.total_amount || order.total) || 0,
        status: order.status || 'pending',
        // Create a readable text list of items (e.g. "Biryani x2, Coke x1").
        itemsList: order.items?.map(item => 
          `${item.menu_item_name || item.name || 'Item'} ×${item.quantity || 1}`
        ) || [],
        customer_name: order.customer_name || 'Customer',
        customer_phone: order.customer_phone || '',
        customer_address: order.customer_address || '',
        payment_method: order.payment_method
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Orders error:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ROLE: Staff / Admin Only.
   * PURPOSE: Moves an order to the next status (e.g. Preparing -> Ready).
   * API CALL: POST /api/restaurant/orders/{id}/update_progress/
   */
  const advanceStatus = async (orderId) => {
    try {
      const response = await api.post(`restaurant/orders/${orderId}/update_progress/`);
      toast.success(response.data.message || "Status updated!");
      fetchOrders(); // Refresh list to show new status.
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Update failed';
      toast.error(errorMsg);
    }
  };

  /**
   * ROLE: Anyone (Staff always, Users only if 'pending').
   * PURPOSE: Marks an order as 'cancelled'.
   * API CALL: POST /api/restaurant/orders/{id}/cancel/
   */
  const cancelOrder = async (orderId) => {
    try {
      const response = await api.post(`restaurant/orders/${orderId}/cancel/`);
      toast.success(response.data.message || "Order cancelled");
      fetchOrders();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to cancel';
      toast.error(errorMsg);
    }
  };

  /**
   * PURPOSE: Filters the orders array based on the selected filter (all, pending, etc.).
   */
  const filteredOrders = orders.filter(order => 
    filter === 'all' || order.status === filter
  );

  /**
   * PURPOSE: Returns the Tailwind CSS classes for status badges.
   * ANALOGY: Like using different colored markers for different order types.
   */
  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
      case 'pending': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'confirmed': return 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      case 'preparing': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'ready': return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'out_for_delivery': return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30';
    }
  };


  if (!isLoggedIn) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-24 transition-colors">
      <div className="text-center bg-white dark:bg-white/5 p-12 rounded-4xl border border-gray-200 dark:border-white/10 shadow-2xl">
        <div className="text-6xl mb-6">🔒</div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Access Restricted</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Please login to view your order history.</p>
        <Link to="/login" className="bg-orange-500 hover:bg-orange-600 text-black px-10 py-4 rounded-2xl font-black transition-all shadow-xl inline-block">
          Sign In Now
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pt-24 pb-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-2">
              {isAdmin || isEmployee ? '📦 Orders Dashboard' : '📋 My Orders'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {isAdmin || isEmployee ? 'Manage incoming and active restaurant orders' : 'Track your delicious meals in real-time'}
            </p>
          </div>
          
          <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-200 dark:border-white/10">
            {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  filter === s 
                    ? 'bg-orange-500 text-black shadow-lg' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-white/10">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <h3 className="text-xl font-bold text-gray-400">Loading orders...</h3>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-white/10">
              <div className="text-6xl mb-4">📜</div>
              <h3 className="text-xl font-bold text-gray-400">No {filter !== 'all' ? filter : ''} orders found</h3>
              {!isLoggedIn && (
                <Link to="/login" className="mt-4 inline-block text-orange-500 font-bold hover:underline">
                  Login to see your orders →
                </Link>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div 
                key={order.id} 
                className={`bg-white dark:bg-white/5 rounded-3xl p-6 md:p-8 border transition-all duration-300 shadow-lg dark:shadow-none ${
                  newOrder === order.order_number 
                    ? 'border-orange-500 ring-2 ring-orange-500/20' 
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-gray-900 dark:text-white">#{order.order_number}</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                      <div className="flex items-center gap-2">
                        <span>📅</span> {order.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💳</span> {order.payment_method || 'Online'}
                      </div>
                    </div>

                    {/* ADDRESS: Visible to staff/admins for delivery, and users for reference */}
                    {(isAdmin || isEmployee || user?.username === order.customer_name) && (
                      <div className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-start gap-2 bg-gray-50 dark:bg-black/10 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                        <span className="text-lg">📍</span>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Delivery Address</span>
                          <span className="text-gray-800 dark:text-gray-300 italic">{order.customer_address}</span>
                          {(isAdmin || isEmployee) && (
                            <span className="mt-1 text-orange-500/80">📞 {order.customer_phone}</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-100 dark:bg-black/20 rounded-2xl p-4 border border-gray-200 dark:border-white/5">
                      <p className="text-[10px] uppercase font-black text-gray-500 dark:text-gray-500 tracking-widest mb-2">Order Items</p>
                      <ul className="space-y-1">
                        {order.itemsList.map((item, idx) => (
                          <li key={idx} className="text-gray-800 dark:text-gray-300 font-bold flex justify-between">
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Total Amount</p>
                      <p className="text-3xl font-black text-orange-500">₹{order.total}</p>
                    </div>

                    <div className="flex gap-3">
                      {(isAdmin || isEmployee) && order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <button 
                          onClick={() => advanceStatus(order.id)}
                          className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-xl font-black text-sm shadow-lg shadow-green-500/20 transition-all active:scale-95"
                        >
                          Advance Status →
                        </button>
                      )}
                      
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => cancelOrder(order.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3 rounded-xl font-black text-sm border border-red-500/20 transition-all active:scale-95"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
