/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#DC2626',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
          border: '#E2E8F0',
        },
      },
      fontSize: {
        'nav': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
        'section': ['1.375rem', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.015em' }],
        'dashboard': ['2rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],
        'card-title': ['1.0625rem', { lineHeight: '1.35', fontWeight: '600', letterSpacing: '-0.01em' }],
        'body-lg': ['0.9375rem', { lineHeight: '1.5' }],
        'body': ['0.875rem', { lineHeight: '1.5' }],
        'label': ['0.8125rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
        nav: '0 1px 2px rgba(15, 23, 42, 0.05)',
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '14px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}