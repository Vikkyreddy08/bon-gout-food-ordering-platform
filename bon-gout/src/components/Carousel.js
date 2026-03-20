/**
 * FILE: bon-gout/src/components/Carousel.js
 * DESCRIPTION: A full-screen, auto-playing image slider for the homepage.
 * PROJECT PART: Frontend (Component)
 * INTERACTIONS: 
 * - Fetches slides from 'api/restaurant/carousel/'.
 * - Uses a fallback (DEFAULT_SLIDES) if the database is empty.
 * - Features a "Ken Burns" effect (slow zoom) for a premium feel.
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';

// Fallback data in case the backend API fails or is empty.
const DEFAULT_SLIDES = [
  {
    image_url: "/assets/carousel/slide1.jpg",
    title: "Gourmet Selections",
    subtitle: "Prepared with precision and premium ingredients"
  },
  {
    image_url: "/assets/carousel/slide2.jpg",
    title: "Signature Flavors",
    subtitle: "A symphony of spices in every bite"
  },
  {
    image_url: "/assets/carousel/slide3.jpg",
    title: "Delicious Moments",
    subtitle: "Freshly made and ready to enjoy"
  }
];

const Carousel = () => {
  // STATE:
  const [slides, setSlides] = useState([]); // Stores the list of banners.
  const [currentSlide, setCurrentSlide] = useState(0); // Index of the currently visible slide.
  const [loading, setLoading] = useState(true);

  /**
   * PURPOSE: Fetches custom banners uploaded by the Admin.
   * API: GET /api/restaurant/carousel/
   */
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await api.get('restaurant/carousel/');
        const apiData = response.data.data || response.data;
        if (Array.isArray(apiData) && apiData.length > 0) {
          setSlides(apiData);
        } else {
          setSlides(DEFAULT_SLIDES);
        }
      } catch (error) {
        console.error("Failed to fetch carousel slides:", error);
        setSlides(DEFAULT_SLIDES);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  /**
   * PURPOSE: Logic to move to the next slide.
   * ANALOGY: Like flipping to the next page in a magazine.
   */
  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  /**
   * PURPOSE: Auto-play timer.
   * LOGIC: Automatically calls 'nextSlide' every 2.5 seconds.
   */
  useEffect(() => {
    if (slides.length > 1) {
      const timer = setInterval(nextSlide, 2500);
      return () => clearInterval(timer);
    }
  }, [slides.length, currentSlide]);

  if (loading && slides.length === 0) {
    return <div className="w-full h-[450px] md:h-[700px] bg-gray-900 animate-pulse flex items-center justify-center text-white text-2xl font-black">Loading Experience...</div>;
  }

  return (
    <div className="relative w-full h-[450px] md:h-[700px] overflow-hidden group">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image Container */}
          <div
            className={`absolute inset-0 transition-transform duration-[4000ms] ease-out ${
              index === currentSlide ? 'scale-105' : 'scale-100'
            }`}
          >
            <img
              src={getImageUrl(slide.image || slide.image_url)}
              alt={slide.title}
              className="w-full h-full object-cover object-center"
            />
            {/* Subtle Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/60" />
          </div>

          {/* Centered Quote Content - Clean & Modern (No Box) */}
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
            <div 
              className={`transition-all duration-1000 ${
                index === currentSlide ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
              }`}
            >
              <h2 
                className={`text-5xl md:text-8xl font-black text-white mb-6 font-poppins leading-tight drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] transition-all duration-1000 delay-300 ${
                  index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
              >
                {slide.title}
              </h2>
              <p 
                className={`text-2xl md:text-4xl text-orange-400 font-medium font-cursive tracking-wide drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] transition-all duration-1000 delay-500 ${
                  index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
              >
                {slide.subtitle}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows (Visible on Hover) */}
      {slides.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-orange-500 hover:text-black transition-all opacity-0 group-hover:opacity-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-orange-500 hover:text-black transition-all opacity-0 group-hover:opacity-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-orange-500 w-8' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
