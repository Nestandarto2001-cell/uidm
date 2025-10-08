/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bid': '#10b981',
        'ask': '#ef4444',
        'bid-bg': '#064e3b',
        'ask-bg': '#7f1d1d',
        'bid-hover': '#059669',
        'ask-hover': '#dc2626',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
