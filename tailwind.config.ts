import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fuel: {
          ink: "#17201b",
          green: "#1f7a4d",
          mint: "#dff5e7",
          lime: "#c7e86b",
          blue: "#277da1",
          amber: "#f2b84b",
          red: "#c94c4c",
          paper: "#f7f7f2"
        }
      },
      boxShadow: {
        soft: "0 14px 40px rgba(23,32,27,0.08)"
      }
    }
  },
  plugins: []
};

export default config;
