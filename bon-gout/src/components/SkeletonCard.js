/**
 * FILE: bon-gout/src/components/SkeletonCard.js
 * DESCRIPTION: A loading placeholder that mimics the layout of a food card.
 * PROJECT PART: Frontend (Shared Component)
 * INTERACTIONS: 
 * - Shown by 'Home.js' and 'Menu.js' while waiting for dishes to load.
 * - Prevents Layout Shift (CLS) by reserving exact space for the final card.
 */

import React from 'react';

const SkeletonCard = () => (
  <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-lg animate-pulse">
    {/* Image Placeholder */}
    <div className="bg-gray-200 dark:bg-white/10 rounded-2xl h-48 mb-4 w-full" />
    
    <div className="space-y-4">
      {/* Title Placeholder */}
      <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-xl w-3/4" />
      
      {/* Description Placeholders */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-5/6" />
      </div>
      
      {/* Price/Time Placeholder */}
      <div className="flex justify-between items-center pt-2">
        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/4" />
        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/4" />
      </div>
      
      {/* Button Placeholder */}
      <div className="h-12 bg-gray-200 dark:bg-white/10 rounded-xl w-full mt-4" />
    </div>
  </div>
);

export default SkeletonCard;
