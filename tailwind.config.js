/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'starry-dark': '#0a0e27',
        'starry-blue': '#1a1f3a',
        'starry-purple': '#4a3aff',
        'starry-pink': '#ff3a9d',
        'star-yellow': '#ffd700',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
