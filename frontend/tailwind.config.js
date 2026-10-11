import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nordic: {
          bg: "#F8F9FA",
          glacier: "#E9F1F7",
          pine: "#2D5A43",
          pineHover: "#234734",
          cyan: "#4FA3A5",
          charcoal: "#1A1D20",
          sage: "#8FA89B",
          sageLight: "#E8F0EC",
          border: "#E2E8F0"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      }
    },
  },
  plugins: [],
};

export default config;
