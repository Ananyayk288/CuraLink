/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#1D64F2', // Primary vibrant blue from photo
          700: '#1554D6',
          800: '#1044B2',
          900: '#0B3082',
        },
        cream: {
          50: '#FAF8F5',
          100: '#FAF7F2',
          200: '#F3EFE8',
          300: '#EAE4D9',
          border: '#E5DFD4',
          card: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
};
