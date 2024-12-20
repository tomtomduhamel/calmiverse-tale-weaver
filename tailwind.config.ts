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
        },
        secondary: {
          DEFAULT: "#457B9D",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#B7E4C7",
          foreground: "#1A1F2C",
        },
        muted: {
          DEFAULT: "#F1FAEE",
          foreground: "#457B9D",
        },
        destructive: {
          DEFAULT: "#FF6B6B",
          foreground: "#FFFFFF",
        },
        neutral: {
          DEFAULT: "#E5E5E5",
          foreground: "#1A1F2C",
        },
      },
      backgroundImage: {
        'gradient-serene': 'linear-gradient(135deg, #A8DADC 0%, #D6CDEA 100%)',
      },
      animation: {
        'slide-down': 'slideDown 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
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
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;