/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // BIS Check Government Palette
        gov: {
          navy: "#08212D",        // Primary header/nav
          "navy-light": "#0D3445", // Secondary surfaces
          blue: "#1688C9",         // Interactive elements, links
          "blue-bg": "#E8F4FA",    // Page background
          orange: "#F5A623",       // Accent / CTA
          green: "#35A853",        // Success / Verified
          red: "#D64545",          // Error / Warning
          white: "#FFFFFF",        // Card backgrounds
          gray: "#F5F7F8",         // Cards / Sections
          text: "#17232B",         // Primary text
          "text-secondary": "#56636D", // Secondary text
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
