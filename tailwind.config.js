/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dde6ff',
          200: '#c3d1ff',
          300: '#9ab2ff',
          400: '#6a87ff',
          500: '#4461f2',
          600: '#2f44e6',
          700: '#2633cc',
          800: '#252ca5',
          900: '#242c82',
          950: '#161a50',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
