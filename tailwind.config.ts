import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", sm: "2rem", lg: "3rem", xl: "4rem" },
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Viom's Paradise — foothill / tea-garden luxury palette
        forest: {
          DEFAULT: "#1F3329",
          50: "#EEF3F0",
          100: "#D7E3DA",
          200: "#AEC7B4",
          300: "#85AB8F",
          400: "#5C8F69",
          500: "#3F5A45",
          600: "#2C4433",
          700: "#233A2B",
          800: "#1F3329",
          900: "#14221B",
          950: "#0C150F",
        },
        moss: {
          DEFAULT: "#3F5A45",
          light: "#5C7863",
        },
        sand: {
          DEFAULT: "#E8DFC8",
          50: "#FBF9F3",
          100: "#F7F5EF",
          200: "#F0EBDD",
          300: "#E8DFC8",
          400: "#D9C9A3",
          500: "#C6AE79",
        },
        gold: {
          DEFAULT: "#B08D57",
          light: "#CBA96F",
          dark: "#8C6E3F",
        },
        ember: {
          DEFAULT: "#A8492A",
          light: "#C05F3C",
          dark: "#7E361F",
        },
        ivory: "#F7F5EF",
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
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Manrope'", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      letterSpacing: {
        widest2: "0.28em",
      },
      boxShadow: {
        luxury: "0 30px 60px -20px rgba(20, 34, 27, 0.35)",
        soft: "0 10px 40px -12px rgba(20, 34, 27, 0.18)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        drift: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.9s cubic-bezier(0.22,1,0.36,1) forwards",
        drift: "drift 40s linear infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
