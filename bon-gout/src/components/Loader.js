/**
 * FILE: bon-gout/src/components/Loader.js
 * DESCRIPTION: A reusable loading spinner component.
 * PROJECT PART: Frontend (Shared Component)
 * INTERACTIONS: 
 * - Shown by 'ProtectedRoute.js' while verifying login status.
 * - Used by pages while waiting for API data.
 */

import React from 'react';

const Loader = ({ className = 'h-64 w-full' }) => (
  <div 
    className={`space-y-4 animate-pulse bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-2xl p-8 flex flex-col justify-center items-center ${className}`}
    role="status"
    aria-label="Loading"
  >
    {/* 
        SPINNER: A rotating circle.
        ANALOGY: Like the "Please Wait" sign in a restaurant lobby.
    */}
    <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
    
    {/* Placeholder bars to mimic text loading */}
    <div className="h-6 bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-xl w-3/4"></div>
    <div className="h-4 bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded w-1/2"></div>
    
    {/* Screen reader only text for accessibility */}
    <span className="sr-only">Loading...</span>
  </div>
);

export default Loader;
