/**
 * FILE: bon-gout/src/pages/About.js
 * DESCRIPTION: Displays the restaurant's history, values, and team.
 * PROJECT PART: Frontend (Page)
 * INTERACTIONS: 
 * - Static content page with links to the Menu.
 */

import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white pt-24 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
        {/* 
            HERO SECTION 
            PURPOSE: Catchy title and mission statement.
        */}
        <div className="text-center mb-12 md:mb-20">
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 bg-clip-text text-transparent mb-6 md:mb-8 animate-float">
            About Bon Gout
          </h1>
          <p className="text-lg md:text-2xl lg:text-3xl text-gray-600 dark:text-gray-200 max-w-3xl mx-auto leading-relaxed mb-8 md:mb-12">
            Authentic Hyderabadi cuisine crafted with ❤️ and 20+ years of tradition
          </p>
        </div>

        {/* 
            STORY SECTION 
            PURPOSE: Tells the "Origin Story" of the restaurant.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center mb-20 md:mb-32">
          <div className="space-y-6 md:space-y-8">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 md:mb-6 text-center md:text-left">
              Our Story
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-6 md:mb-8 text-center md:text-left">
              Bon Gout was born in the bustling streets of Hyderabad, where the aroma of 
              Dum Biryani and Tandoori Chicken first captured our hearts.
            </p>
            
            {/* TIMELINE: Shows key milestones in the business history. */}
            <div className="space-y-6 border-l-2 border-orange-500/30 pl-6 md:pl-8 ml-2">
              <div className="relative">
                <div className="absolute -left-[33px] md:-left-[41px] top-1 w-3 md:w-4 h-3 md:h-4 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
                <h4 className="text-lg md:text-xl font-bold text-orange-600 dark:text-orange-400">2005 - The Beginning</h4>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Started as a small stall in Charminar with just 3 signature dishes.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[33px] md:-left-[41px] top-1 w-3 md:w-4 h-3 md:h-4 rounded-full bg-orange-500/50"></div>
                <h4 className="text-lg md:text-xl font-bold text-gray-700 dark:text-white/80">2015 - Expansion</h4>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Opened our first full-service restaurant in Banjara Hills.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[33px] md:-left-[41px] top-1 w-3 md:w-4 h-3 md:h-4 rounded-full bg-orange-500/50"></div>
                <h4 className="text-lg md:text-xl font-bold text-gray-700 dark:text-white/80">2024 - Digital Era</h4>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Launched Bon Gout online to bring tradition to your doorstep.</p>
              </div>
            </div>

            <div className="flex justify-center md:justify-start pt-6 md:pt-8">
              <Link
                to="/menu"
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black px-8 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-3xl font-black text-lg md:text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center space-x-3"
              >
                🍽️ Explore Menu
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-gray-200 dark:border-white/10 hover:border-orange-500/30 dark:hover:border-orange-400/50 hover:shadow-2xl transition-all duration-300 group">
              <div className="text-4xl md:text-6xl font-black text-orange-500 mb-2 md:mb-4 group-hover:scale-110 transition-transform">8+</div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 uppercase tracking-tighter">Menu Items</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm md:text-lg">From Biryani to Desserts</div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-gray-200 dark:border-white/10 hover:border-orange-500/30 dark:hover:border-orange-400/50 hover:shadow-2xl transition-all duration-300 group">
              <div className="text-4xl md:text-6xl font-black text-orange-500 mb-2 md:mb-4 group-hover:scale-110 transition-transform">500+</div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 uppercase tracking-tighter">Customers</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm md:text-lg">5⭐ Reviews</div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-gray-200 dark:border-white/10 hover:border-orange-500/30 dark:hover:border-orange-400/50 hover:shadow-2xl transition-all duration-300 group md:col-span-2">
              <div className="text-4xl md:text-6xl font-black text-orange-500 mb-2 md:mb-4 group-hover:scale-110 transition-transform">25+</div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 uppercase tracking-tighter">Daily Orders</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm md:text-lg">Freshly prepared every time</div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20 md:mb-32">
          <h2 className="text-3xl md:text-6xl font-black text-center bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-10 md:mb-16">
            Meet Our Master Chefs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { name: "Chef Ahmed", role: "Head of Biryani", desc: "30 years of experience in Hyderabadi Dum Biryani.", img: "https://images.unsplash.com/photo-1583394293214-28dea15ee548?auto=format&fit=crop&w=400&q=80" },
              { name: "Chef Sarah", role: "Pastry Specialist", desc: "Creating the most authentic Double Ka Meetha in town.", img: "https://images.unsplash.com/photo-1595273670150-db0a3e392432?auto=format&fit=crop&w=400&q=80" },
              { name: "Chef Raj", role: "Grill Master", desc: "Expert in Tandoori and Seekh Kebabs.", img: "https://images.unsplash.com/photo-1622021142947-da7dedc48fdc?auto=format&fit=crop&w=400&q=80" }
            ].map((chef, idx) => (
              <div key={idx} className="group relative bg-gray-50 dark:bg-white/5 backdrop-blur-xl rounded-3xl md:rounded-4xl overflow-hidden border border-gray-200 dark:border-white/10 hover:border-orange-500/30 dark:hover:border-orange-500/50 transition-all duration-500 shadow-lg dark:shadow-none">
                <div className="h-64 md:h-80 overflow-hidden">
                  <img src={chef.img} alt={chef.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">{chef.name}</h3>
                  <p className="text-orange-600 dark:text-orange-500 font-bold mb-3 md:mb-4">{chef.role}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">{chef.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="text-center mb-12 md:mb-24">
          <h2 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-8 md:mb-12">
            What Makes Us Special
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            <div className="group bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/10 hover:border-orange-400/50 hover:bg-white/10 hover:-translate-y-4 transition-all duration-500 shadow-xl hover:shadow-2xl">
              <div className="text-4xl md:text-5xl mb-4 md:mb-6 group-hover:rotate-12 transition-transform">🔥</div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Fresh Ingredients</h3>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">Sourced daily from local markets for maximum freshness and flavor</p>
            </div>
            <div className="group bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/10 hover:border-orange-400/50 hover:bg-white/10 hover:-translate-y-4 transition-all duration-500 shadow-xl hover:shadow-2xl">
              <div className="text-4xl md:text-5xl mb-4 md:mb-6 group-hover:rotate-12 transition-transform">👨‍🍳</div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Master Chefs</h3>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">25+ years experience perfecting Hyderabadi recipes</p>
            </div>
            <div className="group bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/10 hover:border-orange-400/50 hover:bg-white/10 hover:-translate-y-4 transition-all duration-500 shadow-xl hover:shadow-2xl">
              <div className="text-4xl md:text-5xl mb-4 md:mb-6 group-hover:rotate-12 transition-transform">⚡</div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Fast Delivery</h3>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">Hot & fresh food delivered in under 30 minutes</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-10 md:py-20 bg-white/5 backdrop-blur-xl rounded-3xl md:rounded-4xl border border-white/10 mx-2 md:mx-8 lg:mx-32">
          <h2 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent mb-6 md:mb-8">
            Ready to Taste Tradition?
          </h2>
          <p className="text-lg md:text-2xl text-gray-200 mb-8 md:mb-12 max-w-2xl mx-auto px-4">
            Join thousands of happy customers who trust Bon Gout for their daily cravings
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center max-w-2xl mx-auto px-6">
            <Link
              to="/menu"
              className="group w-full sm:w-auto bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-lg md:text-xl shadow-3xl hover:shadow-4xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3"
            >
              🍽️ Full Menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
