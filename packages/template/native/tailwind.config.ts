import type { Config } from "tailwindcss";
import daisyui from "daisyui";

export default {
  content: [
    "./components/**/*.{js,ts,jsx,tsx}",
    "./docs/**/*.mdx",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: ["light", "dark"],
  },
} satisfies Config;