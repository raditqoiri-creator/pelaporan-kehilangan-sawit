/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        canopy: {
          950: "#081712",
          900: "#0D2318",
          800: "#123020",
          700: "#173D28",
          600: "#1F4E33",
          500: "#2A6642",
        },
        paper: {
          50: "#FBFAF7",
          100: "#F5F6F0",
          200: "#EBEAE2",
        },
        ink: {
          900: "#141F19",
          700: "#33453C",
          500: "#5B6B62",
        },
        alert: {
          DEFAULT: "#C2410C",
          light: "#F5E4D8",
          dark: "#9A3412",
        },
        gold: {
          50: "#FBF4DC",
          light: "#F3E9C7",
          DEFAULT: "#C9A227",
          600: "#B8901C",
          dark: "#8A6A14",
        },
        status: {
          new: "#C2410C",
          review: "#B7791F",
          done: "#173D28",
        },
      },
      fontFamily: {
        display: [
          '"Century Gothic"',
          '"Poppins"',
          '"Trebuchet MS"',
          '"Segoe UI Semibold"',
          "sans-serif",
        ],
        body: [
          '"Segoe UI"',
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',
          "sans-serif",
        ],
        mono: [
          '"Cascadia Mono"',
          '"Consolas"',
          '"SFMono-Regular"',
          "Menlo",
          "monospace",
        ],
      },
      backgroundImage: {
        "stamp-ring": "repeating-radial-gradient(circle, transparent, transparent 2px, currentColor 2px, currentColor 3px)",
      },
    },
  },
  plugins: [],
};
