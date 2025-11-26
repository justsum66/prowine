import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#1A1A1A',
        'primary-gold': '#B8860B',
        'primary-burgundy': '#722F37',
        'primary-cream': '#F5F1E8',
        'accent-copper': '#B87333',
        'accent-sage': '#8B9A7E',
        'accent-plum': '#5D3A5A',
        'secondary-grey-100': '#FAFAFA',
        'secondary-grey-200': '#E5E5E5',
        'secondary-grey-400': '#999999',
        'secondary-grey-600': '#666666',
        'secondary-grey-800': '#333333',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'var(--font-cormorant)', 'serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.6' }],
        base: ['16px', { lineHeight: '1.6' }],
        lg: ['18px', { lineHeight: '1.6' }],
        xl: ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.4' }],
        '3xl': ['30px', { lineHeight: '1.3' }],
        '4xl': ['36px', { lineHeight: '1.2' }],
        '5xl': ['48px', { lineHeight: '1.2' }],
        '6xl': ['60px', { lineHeight: '1.1' }],
        '7xl': ['72px', { lineHeight: '1.1' }],
      },
      spacing: {
        // 8pt Grid System
        '4': '4px',    // 極小間距
        '8': '8px',    // 最小間距
        '12': '12px',  // 小間距
        '16': '16px',  // 標準間距
        '24': '24px',  // 中間距
        '32': '32px',  // 大間距
        '48': '48px',  // 超大間距
        '64': '64px',  // 區塊間距
        '96': '96px',  // Section 間距
        '128': '128px', // Hero 間距
        '144': '36rem',
      },
      transitionTimingFunction: {
        'in-out-cubic': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'in-out-quart': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
      transitionDuration: {
        'fast': '200ms',
        'base': '300ms',
        'slow': '500ms',
        'slower': '800ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}

export default config

