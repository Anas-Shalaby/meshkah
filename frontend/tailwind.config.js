export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",

  theme: {
    extend: {
      screens: {
        xs: "475px",
      },
      colors: {
        gray: {
          950: "#030303", // Ultra-dark background
          900: "#0a0a0a",
          800: "#111111",
        },
        animation: {
          blob: "blob 7s infinite",
        },
        keyframes: {
          blob: {
            "0%": { transform: "translate(0px, 0px) scale(1)" },
            "33%": { transform: "translate(30px, -50px) scale(1.1)" },
            "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
            "100%": { transform: "translate(0px, 0px) scale(1)" },
          },
        },
        primary: {
          300: "#7dd3fc",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e40af",
        },
        dark: {
          background: "#0A0A0A", // Deep black
          surface: "#1A1A1A", // Slightly lighter black
          primary: "#2563EB", // Vibrant blue
          secondary: "#10B981", // Mint green
          text: "#E0E0E0", // Light gray
          muted: "#666666", // Muted gray
        },
        // Light mode colors with clean, crisp feel
        light: {
          background: "#FFFFFF", // Pure white
          surface: "#F9FAFB", // Very light gray
          primary: "#3B82F6", // Soft blue
          secondary: "#10B981", // Mint green
          text: "#1F2937", // Dark gray
          muted: "#6B7280", // Medium gray
        },
      },
      // Sharp, modern borderRadius
      borderRadius: {
        xl: "0.75rem", // Slightly sharper corners
        "2xl": "1rem", // Even sharper corners
        "3xl": "1.5rem", // Very sharp corners
      },
      // Modern box shadows for depth
      boxShadow: {
        "ai-light":
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 5px 15px -5px rgba(0, 0, 0, 0.04)",
        "ai-dark":
          "0 10px 25px -5px rgba(255, 255, 255, 0.05), 0 5px 15px -5px rgba(255, 255, 255, 0.02)",
        "ai-hover-light": "0 15px 30px -10px rgba(0, 0, 0, 0.15)",
        "ai-hover-dark": "0 15px 30px -10px rgba(255, 255, 255, 0.1)",
      },
      // Modern typography with global font support
      fontFamily: {
        naskh: ["Noto Naskh Arabic", "Amiri", "Scheherazade", "serif"],
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
        cairo: ["Cairo", "Noto Sans Arabic", "Tajawal", "sans-serif"],
        // Global font stack for better cross-platform support
        global: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
          "sans-serif",
        ],
      },
      // Smooth transitions
      transitionProperty: {
        ai: "background-color, color, transform, box-shadow",
      },
      // Glassmorphism-inspired backdrop
      backdropBlur: {
        ai: "12px",
      },
      // Subtle animations
      keyframes: {
        "ai-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "ai-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        fadeInList: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInItem: {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "ai-float": "ai-float 3s ease-in-out infinite",
        "ai-pulse": "ai-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-list": "fadeInList 0.5s ease-out",
        "fade-in-item": "fadeInItem 0.5s ease-out forwards",
      },
    },
  },
  plugins: [
    // Optional: Add plugin for more AI-like interactions
    function ({ addUtilities }) {
      const newUtilities = {
        ".ai-hover": {
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "scale(1.02)",
            "box-shadow": "var(--tw-shadow-colored)",
          },
        },
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
