import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0f428f",
          navy: "#162950",
          dark: "#343538",
          muted: "#5d6b82",
          sale: "#f12a2a",
          border: "#d1d5db",
          // Aliases → original scheme (no amber / ice / deep indigo)
          indigo: "#162950",
          amber: "#0f428f",
          ice: "#f8fafc",
          charcoal: "#343538",
          paper: "#ffffff",
          gold: "#0f428f",
          "gold-light": "#3d6eb5",
          off: "#f8fafc",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        display: ["var(--font-syne)", "Syne", "sans-serif"],
        body: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        bloom: "0 0 0 1px rgba(15,66,143,0.08), 0 18px 50px -20px rgba(15,66,143,0.35)",
        glow: "0 0 40px rgba(15,66,143,0.35)",
      },
      backgroundImage: {
        "gradient-conic":
          "conic-gradient(var(--conic-position), var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
} satisfies Config;
