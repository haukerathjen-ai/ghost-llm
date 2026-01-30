```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/desktop/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'ghost-dark': '#1a1a1a',
        'ghost-accent': '#00ff88',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```