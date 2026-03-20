/**
 * FILE: bon-gout/src/context/ThemeContext.js
 * DESCRIPTION: Manages the visual theme (Light/Dark mode) for the entire app.
 * PROJECT PART: Frontend (React Context)
 * INTERACTIONS: 
 * - Provides 'isDarkMode' status to components for conditional styling.
 * - Persists the theme choice in 'localStorage' so the app "remembers" your choice.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the Context - the global "light switch".
const ThemeContext = createContext();

/**
 * PURPOSE: The Wrapper component that applies the theme to the HTML document.
 * LOGIC: 
 * - Checks 'localStorage' for a saved theme.
 * - If no saved theme, checks the computer's system preference (Dark/Light).
 */
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if the user has visited before and saved a preference.
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // If first time, match the computer's system setting!
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  /**
   * PURPOSE: Updates the physical "dark" class on the <html> tag.
   * LOGIC: Tailwind CSS uses the 'dark' class on <html> to switch colors.
   */
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Function to flip the switch!
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * PURPOSE: Custom hook to easily toggle the theme in any component.
 * USAGE: const { toggleTheme } = useTheme();
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

