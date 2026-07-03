/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#1C2333",
        panel: "#232B3D",
        canvas: "#F5F6F8",
        ink: "#1A1F2B",
        muted: "#6B7280",
        signal: {
          amber: "#F5A623",
          red: "#E5484D",
          green: "#2F9E58",
          blue: "#3E63DD",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16, 20, 30, 0.06), 0 8px 24px rgba(16, 20, 30, 0.06)",
      },
    },
  },
  plugins: [],
};
