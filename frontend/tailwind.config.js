/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1280px" },
    },
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "surface-container": "hsl(var(--surface-container))",
        "surface-container-low": "hsl(var(--surface-container-low))",
        "surface-container-high": "hsl(var(--surface-container-high))",
        "accent-amber": "hsl(var(--accent-amber))",
        "accent-mint": "hsl(var(--accent-mint))",
        "card-hero": "hsl(var(--card-hero))",
        "card-hero-foreground": "hsl(var(--card-hero-foreground))",
      },
      borderRadius: {
        lg: "1.5rem",   /* 24px — cards */
        md: "1rem",      /* 16px — default */
        sm: "0.75rem",   /* 12px */
        xl: "2rem",      /* 32px */
        "2xl": "2.5rem", /* 40px */
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-hero": ["56px", { lineHeight: "60px", letterSpacing: "-0.03em", fontWeight: "800" }],
        "display-hero-mobile": ["40px", { lineHeight: "44px", letterSpacing: "-0.025em", fontWeight: "800" }],
        "headline-lg": ["36px", { lineHeight: "42px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg-mobile": ["28px", { lineHeight: "34px", letterSpacing: "-0.015em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "30px", letterSpacing: "-0.015em", fontWeight: "700" }],
        "headline-sm": ["20px", { lineHeight: "26px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "label-lg": ["15px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-md": ["13px", { lineHeight: "18px", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.04em", fontWeight: "700" }],
      },
      spacing: {
        "space-xs": "0.375rem",
        "space-sm": "0.75rem",
        "space-md": "1.25rem",
        "space-lg": "2rem",
        "space-xl": "3.5rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px hsl(var(--primary) / 0.3)" },
          "50%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.5)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
