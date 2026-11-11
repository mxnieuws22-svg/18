import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#08080a", 900: "#0d0d10", 800: "#141418", 700: "#1c1c22", 600: "#2a2a32" },
        accent: { DEFAULT: "#c9a2ff", soft: "#e4d2ff", deep: "#8b5cf6" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
