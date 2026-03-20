/**
 * FILE: bon-gout/src/pages/Contact.js
 * DESCRIPTION: The "Customer Care" portal for user queries and feedback.
 * PROJECT PART: Frontend (Page)
 * INTERACTIONS: 
 * - Sends support requests to the 'customer-care/' backend API.
 * - These requests appear in the 'AdminDashboard.js' for staff to resolve.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export default function Contact() {
  // STATE: Stores user input for Name, Phone, and Message.
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * PURPOSE: Submits the support request to the backend.
   * WORKFLOW:
   * 1. User fills form.
   * 2. React sends POST request to API.
   * 3. Backend saves the request and marks it as 'unresolved'.
   * 4. Staff sees it on their dashboard and can call the customer back.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // API: POST /api/restaurant/customer-care/
      const response = await api.post('restaurant/customer-care/', form);
      const message = response.data.message || '🎉 Support request sent! We will call you within 10 minutes.';
      toast.success(message);
      
      // Clear form on success
      setForm({ name: '', phone: '', message: '' });
    } catch (error) {
      console.error('Failed to send support request:', error);
      toast.error('Failed to send request. Please try again or call us directly.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white pt-24 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
        {/* Hero */}
        <div className="text-center mb-12 md:mb-24">
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 bg-clip-text text-transparent mb-6 md:mb-8">
            Customer Care
          </h1>
          <p className="text-lg md:text-2xl text-gray-600 dark:text-gray-200 max-w-3xl mx-auto leading-relaxed px-4 font-medium">
            Have a question or need help with your order? Our support team is here for you 24/7.
          </p>
        </div>

        {/* Contact Info & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 items-start">
          {/* Contact Info */}
          <div className="space-y-6 md:space-y-8 lg:sticky lg:top-24">
            <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl md:rounded-4xl border border-gray-200 dark:border-white/10 hover:border-orange-500/30 dark:hover:border-orange-400/50 transition-all duration-300 shadow-lg dark:shadow-none">
              <div className="text-4xl md:text-5xl mb-4 md:mb-6 animate-bounce">📱</div>
              <h3 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Live Support
              </h3>
              <div className="space-y-4">
                <div className="text-2xl md:text-4xl font-black text-orange-600 dark:text-orange-500 mb-1 md:mb-2">+91 9652191206</div>
                <p className="text-gray-500 dark:text-gray-300 text-base md:text-lg font-medium">We usually reply in under 2 minutes</p>
                <a 
                  href="https://wa.me/919652191206" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full md:w-auto inline-flex items-center justify-center space-x-3 bg-green-500 hover:bg-green-600 text-white font-black px-8 py-5 rounded-2xl md:rounded-3xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  <span>💬 Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-white/10 text-center hover:shadow-xl transition-all shadow-md dark:shadow-none">
                <div className="text-2xl md:text-3xl mb-3 md:mb-4">📍</div>
                <h4 className="text-lg md:text-xl font-bold mb-1 md:mb-2 text-gray-900 dark:text-white">Main Kitchen</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">Hyderabad, Telangana</p>
                <p className="text-[10px] md:text-xs font-black text-orange-500 uppercase tracking-widest mt-2">11AM - 11PM Daily</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-white/10 text-center hover:shadow-xl transition-all shadow-md dark:shadow-none">
                <div className="text-2xl md:text-3xl mb-3 md:mb-4">📧</div>
                <h4 className="text-lg md:text-xl font-bold mb-1 md:mb-2 text-gray-900 dark:text-white">Email Us</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base font-medium">support@bon-gout.com</p>
                <p className="text-[10px] md:text-xs font-black text-blue-500 uppercase tracking-widest mt-2">Response in 24hrs</p>
              </div>
            </div>
          </div>

          {/* Support Form */}
          <div className="bg-gray-50 dark:bg-gradient-to-b dark:from-white/5 dark:to-black/50 backdrop-blur-xl p-8 md:p-12 rounded-3xl md:rounded-4xl border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-none transition-colors duration-300">
            <h3 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent text-center">
              Send a Message
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm md:text-base font-black mb-2 md:mb-3 text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full p-4 md:p-5 rounded-2xl md:rounded-3xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white placeholder-gray-400 text-base md:text-lg focus:outline-none focus:ring-4 focus:ring-orange-500/30 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/50 shadow-sm dark:shadow-none"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm md:text-base font-black mb-2 md:mb-3 text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full p-4 md:p-5 rounded-2xl md:rounded-3xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white placeholder-gray-400 text-base md:text-lg focus:outline-none focus:ring-4 focus:ring-orange-500/30 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/50 shadow-sm dark:shadow-none"
                  placeholder="+91 98xxx xxxxx"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm md:text-base font-black mb-2 md:mb-3 text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  How can we help?
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows="4"
                  required
                  className="w-full p-4 md:p-5 rounded-2xl md:rounded-3xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white placeholder-gray-400 text-base md:text-lg focus:outline-none focus:ring-4 focus:ring-orange-500/30 backdrop-blur-xl resize-vertical transition-all duration-300 hover:border-orange-500/50 shadow-sm dark:shadow-none"
                  placeholder="Order issues, feedback, or special requests..."
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 md:py-6 px-6 md:px-8 rounded-2xl md:rounded-3xl font-black text-lg md:text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3 ${
                  isLoading
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Submit Request</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200 dark:border-white/20 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-4 font-medium">Or browse our full menu:</p>
              <Link
                to="/menu"
                className="inline-flex items-center space-x-3 bg-gray-100 dark:bg-white/10 backdrop-blur-xl px-8 py-4 rounded-2xl md:rounded-3xl border border-gray-200 dark:border-white/20 hover:border-orange-500/50 hover:bg-gray-200 dark:hover:bg-white/20 font-black text-gray-900 dark:text-white transition-all duration-300 shadow-sm"
              >
                <span>🍽️ Explore Menu</span>
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 md:mt-32 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-10 md:mb-16">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4 md:space-y-6 px-2 md:px-0">
            {[
              { q: "What are your delivery hours?", a: "We deliver from 11:00 AM to 11:00 PM every day, including weekends and public holidays." },
              { q: "Is there a minimum order value?", a: "Yes, the minimum order value for home delivery is ₹300." },
              { q: "How can I track my order?", a: "Once your order is confirmed, you can track its live status in the 'My Orders' section of your profile." },
              { q: "Do you cater for large events?", a: "Absolutely! We offer special catering packages for weddings and parties. Use the form above to get a quote." }
            ].map((faq, idx) => (
              <details key={idx} className="group bg-gray-50 dark:bg-white/5 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden transition-all duration-300 hover:border-orange-500/30 shadow-sm dark:shadow-none">
                <summary className="flex items-center justify-between p-6 md:p-8 cursor-pointer list-none">
                  <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors pr-4">{faq.q}</span>
                  <span className="text-orange-500 transition-transform duration-300 group-open:rotate-180 flex-shrink-0">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 md:px-8 pb-6 md:pb-8 text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed font-medium">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
