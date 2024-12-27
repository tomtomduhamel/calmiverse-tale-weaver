import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#A8DADC",
          foreground: "#1A1F2C",
          dark: "#457B9D",
        },
        secondary: {
          DEFAULT: "#457B9D",
          foreground: "#FFFFFF",
          dark: "#2C3E50",
        },
        accent: {
          DEFAULT: "#B7E4C7",
          foreground: "#1A1F2C",
          dark: "#2C5F3F",
        },
        muted: {
          DEFAULT: "#F1FAEE",
          foreground: "#457B9D",
          dark: "#1A2238",
        },
        destructive: {
          DEFAULT: "#FF6B6B",
          foreground: "#FFFFFF",
        },
        neutral: {
          DEFAULT: "#E5E5E5",
          foreground: "#1A1F2C",
          dark: "#2C2C2C",
        },
        card: {
          start: "#D6EAF8",
          end: "#B7CFEA",
          hover: {
            start: "#C9E4DE",
            end: "#F1FAEE",
          },
        },
      },
      backgroundImage: {
        'gradient-serene': 'linear-gradient(135deg, var(--card-bg-start), var(--card-bg-end))',
        'gradient-night': 'linear-gradient(180deg, #D6EAF8 0%, #C9E4DE 33%, #B7CFEA 66%, #1A2238 100%)',
      },
      animation: {
        'slide-down': 'slideDown 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-up': 'scaleUp 0.2s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-100%)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
