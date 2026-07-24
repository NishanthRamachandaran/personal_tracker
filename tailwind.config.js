/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0D0D12",
        surface: {
          DEFAULT: "#16161D",
          level1: "#16161D",
          level2: "#1F1F28",
          level3: "#2A2A36",
          bright: "#363646",
        },
        "on-surface": {
          DEFAULT: "#eadfed",
          variant: "#a099a8",
        },
        outline: {
          DEFAULT: "#2d2836",
          variant: "#3d3748",
        },
        // Category neons per prompt specification
        habit: {
          DEFAULT: "#A855F7",
          primary: "#c084fc",
          container: "#7e22ce",
          glow: "rgba(168, 85, 247, 0.25)",
        },
        expense: {
          DEFAULT: "#22D3EE",
          secondary: "#38bdf8",
          container: "#0284c7",
          glow: "rgba(34, 211, 238, 0.25)",
        },
        mood: {
          DEFAULT: "#EC4899",
          pink: "#f472b6",
          container: "#be185d",
          glow: "rgba(236, 72, 153, 0.25)",
        },
        health: {
          DEFAULT: "#84CC16",
          tertiary: "#a3e635",
          container: "#4d7c0f",
          glow: "rgba(132, 204, 22, 0.25)",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        "glow-habit": "0 0 20px 0 rgba(168, 85, 247, 0.35)",
        "glow-expense": "0 0 20px 0 rgba(34, 211, 238, 0.35)",
        "glow-mood": "0 0 20px 0 rgba(236, 72, 153, 0.35)",
        "glow-health": "0 0 20px 0 rgba(132, 204, 22, 0.35)",
        "glow-fab": "0 0 25px 4px rgba(168, 85, 247, 0.5)",
      },
    },
  },
  plugins: [],
};
