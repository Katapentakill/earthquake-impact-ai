/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'seismic-low': '#4ade80',
        'seismic-moderate': '#fbbf24',
        'seismic-high': '#f97316',
        'seismic-catastrophic': '#dc2626',
      },
    },
  },
  plugins: [],
}
