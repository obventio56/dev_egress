/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: false,
  theme: {
    fontFamily: {
      sans: ["Inter", "sans-serif"],
      serif: ["Merriweather", "serif"],
      mono: ["JetBrains Mono", "monospace"],
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        btn: {
          background: "hsl(var(--btn-background))",
          "background-hover": "hsl(var(--btn-background-hover))",
        },
      },
    },
  },
  plugins: [],
};
