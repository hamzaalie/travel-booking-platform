/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8e7f0',
          100: '#c5c3da',
          200: '#9f9cc2',
          300: '#7975aa',
          400: '#5d5898',
          500: '#413b86',
          600: '#3a357e',
          700: '#312d73',
          800: '#282569',
          900: '#191756',
          950: '#05014A',
          DEFAULT: '#05014A',
        },
        accent: {
          50: '#fef5e7',
          100: '#fde5c3',
          200: '#fcd49b',
          300: '#fac373',
          400: '#f9b555',
          500: '#F48C1B',
          600: '#f09a18',
          700: '#eb8a14',
          800: '#e67a10',
          900: '#dd5f08',
          DEFAULT: '#F48C1B',
        },
        brand: {
          navy: '#05014A',
          orange: '#F48C1B',
          black: '#000000',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'large': '0 10px 40px rgba(0, 0, 0, 0.12)',
        'xl': '0 20px 60px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
