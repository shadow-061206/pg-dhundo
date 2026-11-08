import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        deep: "#2a1458", // navbar, primary buttons
        brand: "#7c3aed", // logo accent, focus, links
        lav: "#f5f2fc", // page background
        line: "#e6e0f5", // borders
        soft: "#ece6fb", // tinted panels
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
