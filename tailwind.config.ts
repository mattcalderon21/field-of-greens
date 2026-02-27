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
        fairway: {
          DEFAULT: '#1a3a2a',
          dark: '#0f2418',
          light: '#2d5c42',
          50: '#f0f7f3',
          100: '#d8ede2',
        },
        cream: {
          DEFAULT: '#f5f0e8',
          dark: '#e8e0d0',
          darker: '#d4c9b5',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e0c278',
          dark: '#a88835',
          50: '#fdf8ee',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0f2418 0%, #1a3a2a 40%, #2d5c42 100%)',
        'fairway-gradient': 'linear-gradient(180deg, #1a3a2a 0%, #0f2418 100%)',
      },
      boxShadow: {
        gold: '0 0 0 2px #c9a84c',
      },
    },
  },
  plugins: [],
}

export default config
