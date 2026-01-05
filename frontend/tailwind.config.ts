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
        // Primary Brand Colors
        primary: {
          DEFAULT: "#0066FF",
          subtle: "#E8F0FE",
        },
        // Accent Colors (Growth/Positive)
        accent: {
          DEFAULT: "#00D4AA",
          subtle: "#E6F9F5",
        },
        // Warning Colors (Caution)
        warning: {
          DEFAULT: "#FFB800",
          subtle: "#FFF8E1",
        },
        // Danger Colors (Critical)
        danger: {
          DEFAULT: "#FF453A",
          subtle: "#FFE9E9",
        },
        // Background & Surface
        background: "#F8FAFC",
        surface: "#FFFFFF",
        surfaceSubtle: "#F1F5F9",
        surfaceHover: "#E2E8F0",
        // Text Colors
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
          muted: "#94A3B8",
        },
        // Legacy compatibility
        border: "#E2E8F0",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      fontSize: {
        // Base: 14px, Scale: 1.2 (Minor Third)
        xs: ["12px", { lineHeight: "1.4", letterSpacing: "0.01em" }],
        sm: ["14px", { lineHeight: "1.5", letterSpacing: "0em" }],
        base: ["14px", { lineHeight: "1.6", letterSpacing: "-0.01em" }],
        lg: ["16px", { lineHeight: "1.5", letterSpacing: "-0.005em" }],
        xl: ["20px", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
        "2xl": ["24px", { lineHeight: "1.35", letterSpacing: "-0.015em" }],
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0,0,0,0.04)",
        card: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
        elevated: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        subtle: "4px",
        medium: "8px",
        rounded: "16px",
        pill: "9999px",
        full: "24px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      transitionDuration: {
        "400": "400ms",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        "smooth-in": "cubic-bezier(0.4, 0, 1, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
