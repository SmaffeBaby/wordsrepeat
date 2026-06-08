import type { Config } from "tailwindcss";
import flowbite from "flowbite/plugin";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./node_modules/flowbite-react/lib/esm/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mist: "#f7f8fb",
        coral: "#ef6f61",
        fern: "#2f8f6b",
        amber: "#f4b860"
      },
      boxShadow: {
        lift: "0 18px 45px rgba(17, 24, 39, 0.12)"
      }
    }
  },
  plugins: [flowbite]
};

export default config;
