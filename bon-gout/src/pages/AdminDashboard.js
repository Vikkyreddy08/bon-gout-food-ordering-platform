/**
 * FILE: bon-gout/src/pages/AdminDashboard.js
 * DESCRIPTION: The command center for restaurant managers (Admins).
 * PROJECT PART: Frontend (Admin Page)
 * INTERACTIONS: 
 * - Fetches 'Orders' and 'Support Requests' from the backend.
 * - Allows Admins to advance order status (e.g., Pending -> Confirmed).
 * - Provides quick links to the Django Admin panel for database management.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // STATE:
  const [orders, setOrders] = useState([]); // List of all customer orders.
  const [supportRequests, setSupportRequests] = useState([]); // List of user queries from Contact page.
  const [employees, setEmployees] = useState([]); // List of restaurant staff.
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // UI Control: 'orders', 'support', or 'staff'.
  
  // STATS: Aggregated data for the dashboard cards.
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    activeSupport: 0
  });

  /**
   * PURPOSE: Security check on load.
   * LOGIC: If a non-admin tries to visit this URL, kick them back to the home page.
   * INTERVIEW NOTE: This is client-side protection. We also have @admin_only 
   * protection on the backend for true security.
   */
  useEffect(() => {
    fetchAdminData();
  }, []);

  /**
   * PURPOSE: Fetches all data needed for the dashboard.
   * API CALLS: 
   * 1. GET /api/restaurant/orders/
   * 2. GET /api/restaurant/customer-care/
   */
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      const ordersRes = await api.get('restaurant/orders/');
      const ordersApiData = ordersRes.data.data || ordersRes.data;
      const ordersData = ordersApiData.results || ordersApiData;
      
      const supportRes = await api.get('restaurant/customer-care/');
      const supportApiData = supportRes.data.data || supportRes.data;
      const supportData = supportApiData.results || supportApiData;

      const employeeRes = await api.get('users/employees/');
      const employeeData = employeeRes.data.data || employeeRes.data;

      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
        
        /**
         * LOGIC: Calculate Sales Stats.
         * ANALOGY: Like an accountant going through the day's receipts.
         * RULE: We only count money as "Sales" if the order is PAID online or DELIVERED (for COD).
         */
        const totals = ordersData.reduce((acc, order) => {
          const amount = parseFloat(order.total_amount || 0);
          
          // LOGIC: Order is "Paid" if it's Online and status is 'confirmed' or beyond.
          const isOnlinePaid = order.payment_method === 'ONLINE' && !['pending', 'cancelled'].includes(order.status);
          const isDeliveredCOD = order.payment_method === 'COD' && order.status === 'delivered';
          
          if (isOnlinePaid || isDeliveredCOD) {
            acc.totalSales += amount;
          }

          if (order.status === 'pending') acc.pendingOrders++;
          if (order.status === 'delivered') acc.deliveredOrders++;
          return acc;
        }, { totalSales: 0, pendingOrders: 0, deliveredOrders: 0 });

        setStats(prev => ({
          ...prev,
          totalOrders: ordersData.length,
          ...totals
        }));
      }

      if (Array.isArray(supportData)) {
        setSupportRequests(supportData);
        const activeSupport = supportData.filter(r => !r.is_resolved).length;
        setStats(prev => ({
          ...prev,
          activeSupport
        }));
      }

      if (Array.isArray(employeeData)) {
        setEmployees(employeeData);
      }

    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  /**
   * DYNAMIC URL: Adjusts based on whether we are on Localhost or Production.
   */
  const ADMIN_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000/admin/' 
    : 'https://foodordering-n21r.onrender.com/admin/';

  /**
   * PURPOSE: Advances an order to the next logical step.
   * WORKFLOW: Pending -> Confirmed -> Preparing -> Ready -> Out for Delivery -> Delivered.
   * API: POST /api/restaurant/orders/{id}/update_progress/
   */
  const advanceStatus = async (orderId) => {
    try {
      const response = await api.post(`restaurant/orders/${orderId}/update_progress/`);
      toast.success(response.data.message || "Status updated!");
      fetchAdminData(); // Refresh data to show the new status.
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to update status";
      toast.error(errorMsg);
    }
  };

  /**
   * PURPOSE: Completely cancels an order.
   * API: POST /api/restaurant/orders/{id}/cancel/
   */
  const cancelOrder = async (orderId) => {
    try {
      const response = await api.post(`restaurant/orders/${orderId}/cancel/`);
      toast.success(response.data.message || "Order cancelled");
      fetchAdminData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to cancel order";
      toast.error(errorMsg);
    }
  };

  /**
   * PURPOSE: Marks a support ticket as "Fixed".
   */
  const resolveSupport = async (requestId) => {
    try {
      await api.patch(`restaurant/customer-care/${requestId}/`, { is_resolved: true });
      toast.success("Support request marked as resolved! ✅");
      fetchAdminData();
    } catch (error) {
      toast.error("Failed to update support request");
    }
  };

  const deleteEmployee = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) return;
    try {
      await api.delete(`users/employees/${employeeId}/`);
      toast.success("Employee account deleted successfully 🗑️");
      fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete employee");
    }
  };

  const deleteSupport = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    try {
      await api.delete(`customer-care/${requestId}/`);
      toast.success("Support request deleted");
      fetchAdminData();
    } catch (error) {
      toast.error("Failed to delete support request");
    }
  };

  if (loading) return <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center text-gray-900 dark:text-white text-2xl font-black transition-colors duration-300">🛡️ Loading Admin Panel...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pt-24 pb-12 px-4 md:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-white dark:bg-white/5 p-8 rounded-4xl border border-gray-200 dark:border-white/10 shadow-xl dark:shadow-none">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">🛡️ Admin Dashboard</h1>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => window.open(`${ADMIN_BASE_URL}restaurant/carouselslide/`, '_blank')} 
              className="bg-orange-500 hover:bg-orange-600 text-black px-8 py-3 rounded-2xl font-black shadow-xl hover:shadow-orange-500/20 transition-all active:scale-95"
            >
              Manage Carousel 🎠
            </button>
            <button 
              onClick={() => window.open(`${ADMIN_BASE_URL}restaurant/menuitem/`, '_blank')} 
              className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white px-8 py-3 rounded-2xl font-bold border border-gray-200 dark:border-white/10 transition-all shadow-lg active:scale-95"
            >
              Manage Menu 📝
            </button>
            <button 
              onClick={() => window.open(`${ADMIN_BASE_URL}restaurant/customercarerequest/`, '_blank')} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:shadow-blue-500/20 transition-all active:scale-95"
            >
              Support Inbox 📞
            </button>
            <button 
              onClick={fetchAdminData} 
              className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white px-8 py-3 rounded-2xl font-bold border border-gray-200 dark:border-white/10 transition-all"
            >
              Refresh 🔄
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {[
            { label: 'Total Sales', value: `₹${stats.totalSales}`, icon: '💰', color: 'text-green-600 dark:text-green-400' },
            { label: 'Orders', value: stats.totalOrders, icon: '📦', color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Pending', value: stats.pendingOrders, icon: '⏳', color: 'text-orange-600 dark:text-orange-400' },
            { label: 'Delivered', value: stats.deliveredOrders, icon: '✅', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Support', value: stats.activeSupport, icon: '📞', color: 'text-red-600 dark:text-red-400' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 dark:bg-white/5 p-6 rounded-4xl border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none hover:border-orange-500/30 transition-all group">
              <span className="text-3xl group-hover:scale-125 transition-transform inline-block">{s.icon}</span>
              <p className="text-gray-500 dark:text-gray-400 mt-4 font-bold uppercase tracking-widest text-[10px]">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 mb-8 max-w-md mx-auto">
          {[
            { id: 'orders', label: 'Orders 📦', count: orders.length },
            { id: 'support', label: 'Support 📞', count: stats.activeSupport },
            { id: 'staff', label: 'Staff 🧑‍🍳', count: employees.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-orange-500 text-black shadow-lg' 
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-black/20 text-black' : 'bg-orange-500/20 text-orange-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-white/5 rounded-4xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl dark:shadow-none transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">📦 Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs font-black uppercase tracking-widest border-b border-gray-200 dark:border-white/10">
                  <tr>
                    <th className="p-8">Order</th>
                    <th className="p-8">Customer & Address</th>
                    <th className="p-8">Amount</th>
                    <th className="p-8">Status</th>
                    <th className="p-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/5 text-gray-900 dark:text-white">
                  {orders.length > 0 ? orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors group">
                      <td className="p-8 font-mono text-orange-600 dark:text-orange-500 font-black">#{order.order_number}</td>
                      <td className="p-8">
                        <p className="font-black text-gray-900 dark:text-white">{order.customer_name}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">{order.customer_phone}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-2 max-w-[200px] line-clamp-2 italic">📍 {order.customer_address}</p>
                      </td>
                      <td className="p-8">
                        <p className="font-black text-lg text-gray-900 dark:text-white">₹{order.total_amount}</p>
                        {order.is_cash_on_delivery && (
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded-full mt-1 inline-block">
                            Cash on Delivery
                          </span>
                        )}
                      </td>
                      <td className="p-8">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          order.status === 'delivered' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' : 
                          order.status === 'pending' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                          order.status === 'confirmed' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' : 
                          order.status === 'preparing' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' : 
                          order.status === 'ready' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 
                          order.status === 'out_for_delivery' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' : 
                          'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-8 text-right">
                        <div className="flex justify-end gap-3">
                          {!['delivered', 'cancelled'].includes(order.status) && (
                            <button 
                              onClick={() => advanceStatus(order.id)} 
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                              Advance ➡️
                            </button>
                          )}
                          {!['delivered', 'cancelled'].includes(order.status) && (
                            <button 
                              onClick={() => cancelOrder(order.id)} 
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-6 py-2.5 rounded-xl text-xs font-black border border-red-500/20 transition-all active:scale-95"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="p-20 text-center text-gray-500 font-bold italic">No recent orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Support Requests Tab */}
        {activeTab === 'support' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <span>📞 Customer Support Inbox</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {supportRequests.length > 0 ? supportRequests.map(request => (
                <div key={request.id} className={`${request.is_resolved ? 'bg-gray-100 dark:bg-white/5 opacity-60' : 'bg-white dark:bg-white/10 border-orange-500/20'} border p-8 rounded-4xl relative overflow-hidden group transition-all shadow-xl dark:shadow-none`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white text-xl">{request.name}</h4>
                      <p className="text-sm text-gray-500 font-bold">{request.phone}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        request.is_resolved ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-orange-500 text-black'
                      }`}>
                        {request.is_resolved ? 'Resolved ✅' : 'New 📬'}
                      </span>
                      <button 
                        onClick={() => deleteSupport(request.id)}
                        className="text-red-500 hover:text-red-600 text-[10px] font-black uppercase tracking-widest"
                      >
                        Delete 🗑️
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-base italic mb-8 leading-relaxed">"{request.message}"</p>
                  <div className="flex justify-between items-center pt-6 border-t border-gray-100 dark:border-white/10">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(request.created_at).toLocaleDateString()}</span>
                    {!request.is_resolved && (
                      <button 
                        onClick={() => resolveSupport(request.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-20 text-center text-gray-400 font-bold text-xl bg-white dark:bg-white/5 rounded-4xl border border-dashed border-gray-300 dark:border-white/10">
                  No support requests found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Staff Management Tab */}
        {activeTab === 'staff' && (
          <div className="bg-white dark:bg-white/5 rounded-4xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl dark:shadow-none transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-transparent">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">🧑‍🍳 Active Staff</h2>
              <button 
                onClick={() => navigate('/add-employee')}
                className="bg-orange-500 hover:bg-orange-600 text-black px-6 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all active:scale-95"
              >
                + Add Employee
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs font-black uppercase tracking-widest border-b border-gray-200 dark:border-white/10">
                  <tr>
                    <th className="p-8">Employee</th>
                    <th className="p-8">Contact</th>
                    <th className="p-8">Joined</th>
                    <th className="p-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/5 text-gray-900 dark:text-white">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-xl border border-orange-500/20">
                            👤
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white">{emp.username}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">#{emp.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-8">
                        <p className="font-bold text-sm text-gray-700 dark:text-gray-300">{emp.email}</p>
                        <p className="text-xs text-gray-500 mt-1">{emp.phone || 'No phone'}</p>
                      </td>
                      <td className="p-8">
                        <span className="text-sm text-gray-500 font-medium">
                          {emp.date_joined ? new Date(emp.date_joined).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="p-8 text-right">
                        <button 
                          onClick={() => deleteEmployee(emp.id)}
                          className="text-red-500 hover:text-red-600 text-xs font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
