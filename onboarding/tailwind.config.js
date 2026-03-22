/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx,css}',
  ],
  theme: {
    extend: {
      colors: {
        // Чёрный и оранжевый
        burn: {
          black: '#0c0c0c',
          dark: '#141414',
          card: '#1a1a1a',
          border: '#2a2a2a',
          orange: '#ea580c',
          orangeLight: '#f97316',
          orangeDim: '#c2410c',
          cream: '#faf5f0',
          muted: '#a8a29e',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
