import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores da marca Gardin Comunicação Visual
        marca: {
          preto: "#111111",
          dourado: "#D4AF37",
          branco: "#FFFFFF",
        },
      },
    },
  },
  plugins: [],
};

export default config;
