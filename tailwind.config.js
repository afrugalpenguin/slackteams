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
        // Slack-inspired color palette
        sidebar: {
          DEFAULT: '#3F0E40',
          hover: '#350D36',
          active: '#1164A3',
          text: '#FFFFFF',
          muted: 'rgba(255,255,255,0.7)',
        },
        slack: {
          purple: '#4A154B',
          aubergine: '#3F0E40',
          green: '#2BAC76',
          blue: '#1264A3',
          yellow: '#ECB22E',
          red: '#E01E5A',
        },
        presence: {
          online: '#2BAC76',
          away: '#ECB22E',
          dnd: '#E01E5A',
          offline: '#616061',
        },
      },
      fontFamily: {
        sans: ['Lato', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
