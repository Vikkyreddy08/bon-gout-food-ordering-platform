/**
 * FILE: bon-gout/src/components/Button.js
 * DESCRIPTION: A highly reusable and customizable button component.
 * PROJECT PART: Frontend (Shared Component)
 * INTERACTIONS: 
 * - Used throughout the app for actions (Add to Cart, Login, etc.).
 * - Can act as either a standard HTML <button> or a React Router <Link>.
 * - Supports multiple variants (primary, danger, etc.) and sizes.
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({
  children,
  variant = 'primary', // Options: primary, secondary, success, danger, ghost
  size = 'md',        // Options: sm, md, lg, xl
  icon,               // Optional emoji or icon component
  to,                 // If provided, the button becomes a Link
  onClick,            // Click handler
  disabled = false,
  className = '',
  type = 'button',
  loading = false     // Shows a spinner if true
}) => {
  /**
   * STYLING STRATEGY:
   * We use a "Base + Variant" approach. 
   * baseStyles apply to ALL buttons, while variants[variant] adds specific colors.
   */
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-3xl shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  // Specific color combinations for different button types.
  const variants = {
    primary: 'bg-gradient-to-r from-orange-500 to-yellow-500 text-black hover:from-orange-600 hover:to-yellow-600 focus:ring-orange-500/50 shadow-orange-500/50 hover:shadow-orange-500/75',
    secondary: 'bg-white/10 backdrop-blur-xl border border-white/20 hover:border-orange-400/50 hover:bg-white/20 text-white focus:ring-orange-500/40 shadow-lg hover:shadow-xl',
    success: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 focus:ring-emerald-500/50 shadow-emerald-500/50 hover:shadow-emerald-500/75',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 focus:ring-red-500/50 shadow-red-500/50 hover:shadow-red-500/75',
    ghost: 'text-white hover:text-orange-400 bg-transparent hover:bg-white/10 backdrop-blur-xl focus:ring-orange-500/30'
  };

  // Padding and font-size adjustments.
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-lg',
    lg: 'px-8 py-4 text-xl',
    xl: 'px-12 py-6 text-2xl'
  };

  /**
   * DYNAMIC ELEMENT:
   * If 'to' is provided, we use the <Link> component for internal routing.
   * Otherwise, we use a standard <button>.
   */
  const isLink = to;
  const Element = isLink ? Link : 'button';

  return (
    <Element
      to={to}
      href={to}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${loading ? 'animate-pulse cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {/* 
          LOADING STATE:
          If 'loading' is true, show a spinning circle instead of the text.
      */}
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2"></div>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="mr-2 text-lg">{icon}</span>}
          {children}
        </>
      )}
    </Element>
  );
};

export default Button;
