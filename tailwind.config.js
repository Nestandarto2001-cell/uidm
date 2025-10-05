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
  // Purge unused styles in production
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    options: {
      safelist: [
        'bg-green-500',
        'bg-red-500',
        'text-green-500',
        'text-red-500',
        'border-green-500',
        'border-red-500',
      ],
    },
  },
}
