/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'bg-blue-600',
    'text-white',
    'border-blue-600',
    'bg-white',
    'text-gray-700',
    'border-gray-300',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

