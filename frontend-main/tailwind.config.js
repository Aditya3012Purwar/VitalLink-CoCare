/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cocare: {
          50: "#eef9f7",
          100: "#d5f0eb",
          200: "#aee1d8",
          300: "#7bcbbf",
          400: "#4aafa1",
          500: "#2f9488",
          600: "#24776e",
          700: "#1f605a",
          800: "#1c4d49",
          900: "#1a403d",
          950: "#0a2423",
        },
        slate: {
          clinical: "#FFFFFF",
          ink: "#0F172A",
          muted: "#475569",
          border: "#E6EEF8",
          surface: "#F8FAFF",
        },
        accent: {
          pink: "#E879F9",
          purple: "#A78BFA",
          cyan: "#06B6D4",
          amber: "#F59E0B",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        body: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        clinical: "0 1px 3px rgba(26, 35, 50, 0.06), 0 8px 24px rgba(26, 35, 50, 0.06)",
        "clinical-lg": "0 4px 12px rgba(26, 35, 50, 0.08), 0 16px 40px rgba(26, 35, 50, 0.1)",
        glow: "0 0 40px rgba(47, 148, 136, 0.15)",
        "glow-pink": "0 0 40px rgba(236, 168, 214, 0.2)",
      },
      borderRadius: {
        clinical: "14px",
      },
      animation: {
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        "marquee-reverse": "marquee-reverse 25s linear infinite",
        "gradient-shift": "gradient-shift 1.5s ease infinite",
        "line-reveal": "line-reveal 0.8s cubic-bezier(0.77, 0, 0.175, 1) forwards",
        "fade-slide-in": "fade-slide-in 0.5s ease-out forwards",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "line-reveal": {
          to: { clipPath: "inset(0 0 0 0)" },
        },
        "fade-slide-in": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
