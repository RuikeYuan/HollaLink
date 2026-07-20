import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0a1229",
          900: "#0f1f3d",
          800: "#152a52",
          700: "#1e3a6e",
          600: "#2a4d8f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
