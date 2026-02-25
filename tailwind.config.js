/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#c6a65d',
        'background-light': '#f8f7f6',
        'background-dark': '#111111',
        'surface-dark': '#1a1a1a',
        'border-gold': 'rgba(198, 166, 93, 0.2)',
        'charcoal-darker': '#0a0a0a',
        'matte-charcoal': '#1a1a1a',
        'neutral-charcoal': '#1e1e1e',
        'border-dark': '#2a2a2a',
        'panel-bg': '#1a1814',
        'border-muted': '#2a2824',
        'charcoal-accent': '#1a1a1a',
        'neutral-dark': '#1e1b14',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(198, 166, 93, 0.15)',
      },
    },
  },
  plugins: [],
}
