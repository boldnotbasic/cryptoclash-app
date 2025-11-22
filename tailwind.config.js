/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-purple': '#8B5CF6',
        'neon-blue': '#3B82F6',
        'neon-turquoise': '#06B6D4',
        'neon-gold': '#F59E0B',
        'dark-bg': '#0F0F23',
        'card-bg': '#1A1A2E',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(139, 92, 246, 0.5)',
        'neon-blue': '0 0 20px rgba(59, 130, 246, 0.5)',
        'neon-turquoise': '0 0 20px rgba(6, 182, 212, 0.5)',
        'neon-gold': '0 0 20px rgba(245, 158, 11, 0.5)',
      },
      animation: {
        'pulse-neon': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
      }
    },
  },
  plugins: [],
}
