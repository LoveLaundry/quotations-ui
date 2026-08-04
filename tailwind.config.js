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
        'nav': ['1.375rem', { lineHeight: '1.4', fontWeight: '500' }],
        'section': ['2.125rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.02em' }],
        'dashboard': ['3.25rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.03em' }],
        'card-title': ['1.625rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.02em' }],
        'body-lg': ['1.375rem', { lineHeight: '1.5' }],
        'body': ['1.25rem', { lineHeight: '1.5' }],
        'label': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
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
