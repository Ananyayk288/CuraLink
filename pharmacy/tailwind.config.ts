import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sticker: {
          pink: {
            DEFAULT: "#EC4899",
            light: "#FDF2F8",
            border: "#DB2777",
            text: "#831843",
          },
          blue: {
            DEFAULT: "#2563EB",
            light: "#EFF6FF",
            border: "#1D4ED8",
            text: "#1E3A8A",
          },
          yellow: {
            DEFAULT: "#EAB308",
            light: "#FEFCE8",
            border: "#CA8A04",
            text: "#713F12",
          },
          green: {
            DEFAULT: "#16A34A",
            light: "#F0FDF4",
            border: "#15803D",
            text: "#14532D",
          },
          orange: {
            DEFAULT: "#EA580C",
            light: "#FFF7ED",
            border: "#C2410C",
            text: "#7C2D12",
          },
          purple: {
            DEFAULT: "#9333EA",
            light: "#FAF5FF",
            border: "#7E22CE",
            text: "#581C87",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
