import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
        // LifeCharter Brand Colors
        brand: {
          "deep-indigo": "#1F315B",
          "royal-plum": "#5E3B6C",
          "sacred-teal": "#2E7C83",
          "soft-lavender": "#CDBFD6",
          "warm-gold": "#D4AF63",
          "ivory-light": "#F6F1E8",
          "soft-taupe": "#B9A9A9",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        editorial: ["Cormorant Garamond", "serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      backgroundImage: {
        "gradient-sacred": "linear-gradient(135deg, #F6F1E8 0%, #FDFBF7 50%, #F6F1E8 100%)",
        "gradient-mystical": "linear-gradient(135deg, #1F315B 0%, #5E3B6C 50%, #2E7C83 100%)",
        "gradient-gold": "linear-gradient(135deg, #D4AF63 0%, #E8D5A3 50%, #D4AF63 100%)",
        "gradient-plum": "linear-gradient(135deg, #5E3B6C 0%, #7B4D8C 100%)",
        "gradient-teal": "linear-gradient(135deg, #2E7C83 0%, #3D9BA3 100%)",
        "watercolor-wash": "radial-gradient(ellipse at top left, rgba(205, 191, 214, 0.2) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(46, 124, 131, 0.1) 0%, transparent 50%), linear-gradient(135deg, #F6F1E8 0%, #FDFBF7 100%)",
      },
      boxShadow: {
        sacred: "0 4px 24px rgba(31, 49, 91, 0.08)",
        "sacred-lg": "0 8px 40px rgba(31, 49, 91, 0.12)",
        gold: "0 4px 14px rgba(212, 175, 99, 0.3)",
        "gold-lg": "0 6px 20px rgba(212, 175, 99, 0.4)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;