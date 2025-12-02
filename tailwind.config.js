/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 新古典主義色調 - 溫暖優雅（升級版）
        primary: {
          50: "#faf8f5",
          100: "#f5f0e8",
          200: "#e8ddd0",
          300: "#d4c2a8",
          400: "#b89d7a",
          500: "#9d7a5c",
          600: "#7d6049",
          700: "#634a3a",
          800: "#523e32",
          900: "#45352b",
        },
        accent: {
          gold: "#d4af37",
          "gold-light": "#e8d5a3",
          "gold-dark": "#b8941f",
          burgundy: "#722f37",
          "burgundy-light": "#8a4a52",
          "burgundy-dark": "#5a252b",
          cream: "#f5e6d3",
        },
        gold: {
          DEFAULT: "#d4af37",
          light: "#e8d5a3",
          dark: "#b8941f",
        },
        burgundy: {
          DEFAULT: "#722f37",
          light: "#8a4a52",
          dark: "#5a252b",
        },
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
        ivory: "#faf8f5",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      fontSize: {
        // P0 #52：字體層次系統
        "display-1": ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "display-2": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-2xl": ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "display-xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["3rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "h1": ["3rem", { lineHeight: "1.3", letterSpacing: "-0.02em" }],
        "h2": ["2.25rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        "h3": ["1.875rem", { lineHeight: "1.4", letterSpacing: "0" }],
        "h4": ["1.5rem", { lineHeight: "1.5", letterSpacing: "0.01em" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6", letterSpacing: "0.01em" }],
        "body": ["1rem", { lineHeight: "1.75", letterSpacing: "0.01em" }],
      },
      spacing: {
        // P0 #3：統一間距系統（8px 基礎網格）
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      boxShadow: {
        // P0 #5：統一陰影系統
        "subtle": "0 1px 2px rgba(0, 0, 0, 0.04)",
        "soft": "0 2px 8px rgba(0, 0, 0, 0.06)",
        "medium": "0 4px 16px rgba(0, 0, 0, 0.08)",
        "strong": "0 8px 32px rgba(0, 0, 0, 0.12)",
        "dramatic": "0 16px 64px rgba(0, 0, 0, 0.16)",
        "hero": "0 24px 96px rgba(0, 0, 0, 0.20)",
        "premium": "0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.04)",
        "premium-lg": "0 30px 80px rgba(0, 0, 0, 0.12), 0 12px 32px rgba(0, 0, 0, 0.06)",
        "gold": "0 10px 40px rgba(212, 175, 55, 0.2)",
        "gold-lg": "0 20px 60px rgba(212, 175, 55, 0.3)",
      },
      animation: {
        // P0 #7：標準動畫時長系統
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "shimmer": "shimmer 3s infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        // 2026高端設計：液態動畫
        "liquid-flow": "liquid-flow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "liquid-slide": "liquid-slide 3s infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        // 2026高端設計：微交互
        "scale-in": "scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "ripple": "ripple 0.3s ease-out",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { left: "-100%" },
          "100%": { left: "100%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.1)" },
        },
        // P0 #60：按鈕動畫
        ripple: {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        // 2026高端設計：液態動畫關鍵幀
        "liquid-flow": {
          "0%": {
            "border-radius": "60% 40% 30% 70% / 60% 30% 70% 40%",
            transform: "translate(0, 0) rotate(0deg)",
          },
          "25%": {
            "border-radius": "30% 60% 70% 40% / 50% 60% 30% 60%",
            transform: "translate(20px, -20px) rotate(5deg)",
          },
          "50%": {
            "border-radius": "70% 30% 40% 60% / 30% 70% 60% 40%",
            transform: "translate(-20px, 20px) rotate(-5deg)",
          },
          "75%": {
            "border-radius": "40% 70% 60% 30% / 70% 40% 50% 30%",
            transform: "translate(10px, 10px) rotate(3deg)",
          },
          "100%": {
            "border-radius": "60% 40% 30% 70% / 60% 30% 70% 40%",
            transform: "translate(0, 0) rotate(0deg)",
          },
        },
        "liquid-slide": {
          "0%": { transform: "translateX(-100%) skewX(-15deg)" },
          "100%": { transform: "translateX(200%) skewX(-15deg)" },
        },
        "gradient-shift": {
          "0%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
          "100%": { "background-position": "0% 50%" },
        },
        // 2026高端設計：微交互關鍵幀
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      borderRadius: {
        // P0 #4：統一圓角系統
        "sm": "4px",
        "md": "8px",
        "lg": "12px",
        "xl": "16px",
        "2xl": "24px",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
