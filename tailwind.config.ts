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
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
        display: ["var(--font-oswald)", "Oswald", "sans-serif"],
        body: ["var(--font-roboto)", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
