/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFCF7',
          100: '#FBF9F0',
          200: '#F6F2E1',
          300: '#EFE8CD',
        },
        royalblue: {
          500: '#2A52BE',
          600: '#1E3F96',
          700: '#162F70',
          800: '#0F2150',
          900: '#0B173B',
        },
      },
    },
  },
  plugins: [],
};
