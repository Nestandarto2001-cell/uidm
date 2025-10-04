/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bid': '#10b981', // green-500
        'ask': '#ef4444', // red-500
        'bid-bg': '#064e3b', // green-900
        'ask-bg': '#7f1d1d', // red-900
        'bid-hover': '#059669', // green-600
        'ask-hover': '#dc2626', // red-600
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'pulse-green': 'pulseGreen 0.5s ease-in-out',
        'pulse-red': 'pulseRed 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGreen: {
          '0%': { backgroundColor: 'rgb(16, 185, 129)' },
          '50%': { backgroundColor: 'rgb(5, 150, 105)' },
          '100%': { backgroundColor: 'rgb(16, 185, 129)' },
        },
        pulseRed: {
          '0%': { backgroundColor: 'rgb(239, 68, 68)' },
          '50%': { backgroundColor: 'rgb(220, 38, 38)' },
          '100%': { backgroundColor: 'rgb(239, 68, 68)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
