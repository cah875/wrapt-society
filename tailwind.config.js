/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette derived from the Northwest Specialty Hospital brand.
        // 600 = the brand blue (#197B97); lighter/darker steps for tints + states.
        clinical: {
          50: '#eef7fa',
          100: '#d5ebf1',
          200: '#aed7e3',
          300: '#7bbccd',
          400: '#479cb3',
          500: '#2483a0',
          600: '#197b97', // brand blue
          700: '#15637a',
          800: '#154f61',
          900: '#143f4d',
          950: '#0c2832',
        },
        // Exact brand colors (logo marks) for accents.
        brand: {
          green: '#3E9D45',
          brown: '#714F39',
          blue: '#197B97',
          gray: '#4C4D4F',
        },
        // Status colors tuned for high contrast / accessibility.
        status: {
          ok: '#2f8a3a', // brand-derived green, legible on light tints
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
