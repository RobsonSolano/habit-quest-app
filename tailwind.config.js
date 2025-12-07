/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B5CF6',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#EC4899',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F59E0B',
          foreground: '#FFFFFF',
        },
        background: '#0F172A',
        foreground: '#F8FAFC',
        card: '#1E293B',
        border: '#334155',
        muted: {
          DEFAULT: '#475569',
          foreground: '#CBD5E1',
        },
      },
    },
  },
  plugins: [],
}

