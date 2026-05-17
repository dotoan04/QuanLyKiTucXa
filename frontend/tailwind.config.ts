import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        body: ['"Nunito"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#EEF2F7',
          100: '#D5DEE8',
          200: '#AABBCE',
          300: '#7D93B3',
          400: '#5570A0',
          500: '#3A5287',
          600: '#1A2B4A',
          700: '#162340',
          800: '#121B34',
          900: '#0E1328',
          950: '#080B18',
        },
        primary: {
          50: '#EEF5FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        surface: {
          DEFAULT: '#F8F9FB',
          50: '#FFFFFF',
          100: '#F4F6F9',
          200: '#EDF0F5',
          300: '#E2E6ED',
          400: '#CBD3DE',
        },
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(26, 43, 74, 0.04), 0 1px 2px -1px rgba(26, 43, 74, 0.04)',
        'card': '0 1px 3px 0 rgba(26, 43, 74, 0.06), 0 1px 2px -1px rgba(26, 43, 74, 0.06)',
        'card-hover': '0 4px 16px -2px rgba(26, 43, 74, 0.08), 0 2px 4px -2px rgba(26, 43, 74, 0.05)',
        'sidebar': '2px 0 12px -1px rgba(26, 43, 74, 0.08)',
        'elevated': '0 8px 32px -4px rgba(26, 43, 74, 0.12), 0 2px 8px -2px rgba(26, 43, 74, 0.06)',
        'focus-ring': '0 0 0 3px rgba(59, 130, 246, 0.15)',
      },
      spacing: {
        'sidebar': '260px',
        'sidebar-collapsed': '72px',
        'header': '60px',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.2s ease-in',
        'scale-in': 'scale-in 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [typography],
}

export default config
