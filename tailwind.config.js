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
        soulsonic: '#302853',           // background color
        offwhite: '#FAF9F6',        // text, buttons
        taupe: '#8B7E74',           // muted text, borders
        rust: '#FF8559',            // accent color (hover states, highlights)
        sage: '#80EF80',            // success/green accent
        gold: '#FFEE8C',            // warning/yellow accent
        cardBg: '#4A4470',
        charcoal: '#C8C6D8',
        lightgray: '#4D4B5E'
      },
      fontFamily: {
        display: ['var(--font-sora)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
