/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F59E0B', // Yellow/Amber
          light: '#FBBF24',
          dark: '#D97706',
        },
        income: {
          DEFAULT: '#10B981', // Green
          light: '#34D399',
          dark: '#059669',
        },
        spend: {
          DEFAULT: '#EF4444', // Red
          light: '#F87171',
          dark: '#DC2626',
        },
        background: '#F8FAFC', // Very light slate
        surface: '#FFFFFF',
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 10px -1px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
