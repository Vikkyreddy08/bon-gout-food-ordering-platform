/**
 * FILE: bon-gout/src/utils/imageUtils.js
 * DESCRIPTION: Utility functions for handling image URLs and fallbacks.
 */

// Fallback image if a dish or slide doesn't have one in the database.
export const DEFAULT_FOOD_IMAGE = "https://images.unsplash.com/photo-1603482665472-61d5a5c8f6ca?w=800";

/**
 * Ensures that an image URL is absolute and properly formatted.
 * Handles Unsplash IDs by prepending the Unsplash domain.
 * @param {string} url - The image URL or ID from the database.
 * @returns {string} - A full, usable image URL.
 */
export const getImageUrl = (url) => {
  if (!url) return DEFAULT_FOOD_IMAGE;
  
  // If it's already a full URL or a local asset path, return it.
  if (url.startsWith('http') || url.startsWith('/assets') || url.startsWith('data:')) {
    return url;
  }
  
  // If it looks like an Unsplash photo ID (e.g., "photo-123..."), prepend the domain.
  if (url.startsWith('photo-')) {
    return `https://images.unsplash.com/${url}`;
  }
  
  // Default fallback if we can't determine the format.
  return url;
};
