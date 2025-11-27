import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "var(--font-arabic)", "system-ui"],
        arabic: ["var(--font-arabic)", "var(--font-display)", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular"],
      },
      colors: {
        sand: {
          50: "#F8F5F1",
          100: "#F1ECE5",
          200: "#E4DACB",
          300: "#D6C6AF",
          400: "#C9B498",
          500: "#B89D7A",
          600: "#9A7E5C",
          700: "#7A6246",
          800: "#524131",
          900: "#3F3A36",
          950: "#1F1B16",
        },
        teal: {
          50: "#D6F2EF",
          100: "#B9E6E1",
          200: "#8BD6CE",
          300: "#54C3B8",
          400: "#2AAEA3",
          500: "#0F5C5C",
          600: "#0C4B4B",
          700: "#083A3A",
          800: "#052A2A",
          900: "#031C1C",
        },
        azure: {
          50: "#E4EFFA",
          100: "#C6DEF3",
          200: "#99C4EA",
          300: "#6EA9E0",
          400: "#418BD3",
          500: "#1D5BA5",
          600: "#17497F",
          700: "#123863",
          800: "#0C2540",
          900: "#071524",
        },
        emerald: {
          50: "#DFF6EE",
          100: "#C0EBD9",
          200: "#90DBBB",
          300: "#5FCA9C",
          400: "#33B87E",
          500: "#1B9C74",
          600: "#14755A",
          700: "#0E5140",
          800: "#083227",
          900: "#041713",
        },
        amber: {
          50: "#FFF4E4",
          100: "#FFE6C4",
          200: "#FFD08F",
          300: "#FFB452",
          400: "#FF9A1F",
          500: "#E6A041",
          600: "#B47631",
          700: "#805320",
          800: "#523312",
          900: "#2F1D0A",
        },
        cranberry: {
          50: "#FBE4EB",
          100: "#F7C9D8",
          200: "#F09AB7",
          300: "#E86C96",
          400: "#DE3F76",
          500: "#C5415A",
          600: "#9A3044",
          700: "#6E2230",
          800: "#44141C",
          900: "#22090E",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 20px 45px -24px rgba(15, 92, 92, 0.35)",
        toolbar: "0 12px 24px -18px rgba(7, 21, 36, 0.4)",
      },
      maxWidth: {
        dashboard: "1240px",
        wizard: "880px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addUtilities, theme }) => {
      const spacing = theme("spacing") as Record<string, string>;
      const logicalUtilities: Record<string, any> = {
        ".ms-auto": { marginInlineStart: "auto" },
        ".me-auto": { marginInlineEnd: "auto" },
        ".ps-auto": { paddingInlineStart: "auto" },
        ".pe-auto": { paddingInlineEnd: "auto" },
      };

      Object.entries(spacing).forEach(([key, value]) => {
        logicalUtilities[`.ms-${key}`] = { marginInlineStart: value };
        logicalUtilities[`.me-${key}`] = { marginInlineEnd: value };
        logicalUtilities[`.ps-${key}`] = { paddingInlineStart: value };
        logicalUtilities[`.pe-${key}`] = { paddingInlineEnd: value };
        logicalUtilities[`.gap-inline-${key}`] = {
          columnGap: value,
        };
      });

      addUtilities(logicalUtilities, ["responsive"]);
    }),
  ],
} satisfies Config;

export default config;
