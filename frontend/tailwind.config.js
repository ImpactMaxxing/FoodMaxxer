/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf5f4',
          100: '#fce8e6',
          200: '#f9d4d0',
          300: '#f3b3ac',
          400: '#e98a7f',
          500: '#B85042',
          600: '#a54539',
          700: '#8a3830',
          800: '#73312b',
          900: '#612d29',
        },
      },
      borderRadius: {
        DEFAULT: '3px',
        'sm': '2px',
        'md': '4px',
        'lg': '6px',
      },
    },
  },
  plugins: [],
}
