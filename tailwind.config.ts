import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#16111b",
        surface: {
          DEFAULT: "#16111b",
          dim: "#16111b",
          bright: "#3d3741",
          lowest: "#110c15",
          low: "#1f1a23",
          container: "#231e27",
          high: "#2e2832",
          highest: "#39323d",
          variant: "#39323d",
        },
        "on-surface": {
          DEFAULT: "#eadfed",
          variant: "#cfc2d6",
        },
        outline: {
          DEFAULT: "#988d9f",
          variant: "#4d4354",
        },
        // Category neons & tokens
        habit: {
          DEFAULT: "#a855f7",
          primary: "#ddb7ff",
          container: "#b76dff",
          glow: "rgba(168, 85, 247, 0.2)",
        },
        expense: {
          DEFAULT: "#22d3ee",
          secondary: "#5de6ff",
          container: "#00cbe6",
          glow: "rgba(34, 211, 238, 0.2)",
        },
        health: {
          DEFAULT: "#84cc16",
          tertiary: "#91db2a",
          container: "#65a100",
          glow: "rgba(132, 204, 22, 0.2)",
        },
        mood: {
          DEFAULT: "#fb7185",
          pink: "#fb7185",
          error: "#ffb4ab",
          glow: "rgba(251, 113, 133, 0.2)",
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
        "glow-health": "0 0 20px 0 rgba(132, 204, 22, 0.35)",
        "glow-mood": "0 0 20px 0 rgba(251, 113, 133, 0.35)",
        "glow-fab": "0 0 25px 4px rgba(168, 85, 247, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
