import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f8fafc",
        "surface-container": "#f1f5f9",
        "surface-container-low": "#f8fafc",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#e2e8f0",
        "surface-container-highest": "#cbd5e1",
        primary: "#1e40af",
        "primary-hover": "#1d4ed8",
        "primary-container": "#dbeafe",
        "on-primary": "#ffffff",
        "on-primary-container": "#1e3a8a",
        secondary: "#047857",
        "secondary-container": "#d1fae5",
        "on-secondary-container": "#064e3b",
        error: "#dc2626",
        "error-container": "#fee2e2",
        outline: "#64748b",
        "outline-variant": "#cbd5e1",
        "on-surface": "#0f172a",
        "on-surface-variant": "#475569"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
