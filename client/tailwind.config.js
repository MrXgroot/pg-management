/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          400: "#FF7A59",
          500: "#FF5E36", // Sunset Coral
          600: "#E64720",
          700: "#C73612",
        },
        surface: {
          canvas: "#F1F4F9",
          card: "#FFFFFF",
          subtle: "#F8FAFC",
          border: "#E2E8F0",
        },
        onyx: {
          800: "#1A1C20",
          900: "#16171C",
          950: "#111215",
        },
      },
      boxShadow: {
        card: "0 4px 16px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)",
        floating:
          "0 16px 36px -4px rgba(15, 23, 42, 0.09), 0 4px 12px -2px rgba(15, 23, 42, 0.03)",
        "glow-coral": "0 10px 25px -4px rgba(255, 94, 54, 0.38)",
      },
      borderRadius: {
        20: "20px",
        24: "24px",
        28: "28px",
        32: "32px",
        36: "36px",
        44: "44px",
      },
    },
  },
  plugins: [],
};
