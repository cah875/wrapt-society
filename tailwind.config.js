/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Calm, clinical palette — blues, grays, whites. No neon.
        clinical: {
          50: '#f1f6fb',
          100: '#dce9f5',
          200: '#bcd4ec',
          300: '#8fb6dd',
          400: '#5b91c9',
          500: '#3a72b3',
          600: '#2b5a96',
          700: '#254a7a',
          800: '#223f66',
          900: '#1f3656',
          950: '#152338',
        },
        // Status colors tuned for high contrast / accessibility.
        status: {
          ok: '#15803d', // green-700
          warn: '#b45309', // amber-700
          danger: '#b91c1c', // red-700
        },
      },
      fontSize: {
        // Slightly larger base for loading-dock readability.
        base: ['1.05rem', { lineHeight: '1.6rem' }],
      },
    },
  },
  plugins: [],
};
