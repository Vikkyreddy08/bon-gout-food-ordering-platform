/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // ✅ Enable class-based dark mode
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'cursive': ['Dancing Script', 'cursive'],
      },
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#1e3a8a',
        },
        secondary: { 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' },
        'bg-primary': { 50: '#fff7ed', 100: '#ffedd5', 500: '#f97316', 600: '#ea580c' },
        'bg-secondary': { 500: '#f59e0b', 600: '#d97706' },
      },
      animation: {
        'pulse-gradient': 'pulse-gradient 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'blob': 'blob 7s infinite',
        'gradient-x': 'gradient-x 4s ease infinite',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',  // ✅ FIXED: camelCase name
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'pulse-gradient': {
          '0%, 100%': { background: 'linear-gradient(45deg, #f97316, #f59e0b, #3b82f6, #8b5cf6)' },
          '50%': { background: 'linear-gradient(45deg, #8b5cf6, #3b82f6, #f59e0b, #f97316)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'blob': {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fadeInUp': {  // ✅ FIXED: Must match animation name exactly (camelCase)
          '0%': { 
            opacity: '0', 
            transform: 'translateY(30px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        '3xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'soft': '0 10px 30px -5px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    function({ addUtilities }) {
      addUtilities({
        '.animate-blob': { animation: 'blob 7s infinite' },
        '.animation-delay-2000': { animationDelay: '2s' },
      });
    },
  ],
}
