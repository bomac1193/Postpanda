/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme primary
        dark: {
          900: '#0a0a0b',
          800: '#111113',
          700: '#18181b',
          600: '#27272a',
          500: '#3f3f46',
          400: '#52525b',
          300: '#71717a',
          200: '#a1a1aa',
          100: '#d4d4d8',
        },
        // Accent color — one only
        accent: {
          purple: '#66023C',
          'purple-dark': '#520230',
        },
        // Platform colors
        instagram: '#E1306C',
        tiktok: '#00f2ea',
        facebook: '#1877F2',
        twitter: '#1DA1F2',
        linkedin: '#0A66C2',
        youtube: '#FF0000',
        pinterest: '#E60023',
        threads: '#000000',
      },
      fontFamily: {
        sans: ['Schon', 'system-ui', 'sans-serif'],
        display: ['Canela', 'Times New Roman', 'serif'],
        mono: ['Sohne Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
