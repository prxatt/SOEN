/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'accent': 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'bg': 'var(--color-bg)',
        'card': 'var(--color-card)',
        'border': 'var(--color-border)',
        'text': 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)'
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem'
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
        mono: ['"Roboto Mono"', 'monospace'],
        brand: ['"Ivy Presto Display"', '"Playfair Display"', 'serif']
      },
      backdropBlur: {
        'xl': '24px'
      },
      keyframes: {
        'subtle-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.9', transform: 'scale(1.02)' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in-fast': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'highlight': {
          '0%, 100%': { 'background-color': 'transparent' },
          '50%': { 'background-color': 'rgba(168, 85, 247, 0.15)' }
        },
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' }
        },
        'pop-in': {
          '0%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1.1)' }
        },
        'subtle-glow': {
          '0%, 100%': { 'box-shadow': '0 0 4px transparent' },
          '50%': { 'box-shadow': '0 0 8px var(--color-accent)' }
        },
        'draw-in': {
          '0%': { transform: 'scaleX(0)', 'transform-origin': 'left' },
          '100%': { transform: 'scaleX(1)', 'transform-origin': 'left' }
        },
        'time-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        }
      },
      animation: {
        'subtle-pulse': 'subtle-pulse 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'fade-in-fast': 'fade-in-fast 0.2s ease-out forwards',
        'highlight': 'highlight 1.5s ease-in-out',
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'pop-in': 'pop-in 0.2s ease-out forwards',
        'subtle-glow': 'subtle-glow 2.5s ease-in-out infinite',
        'draw-in': 'draw-in 0.8s ease-out forwards',
        'time-pulse': 'time-pulse 2.5s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
