import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  content: [
    "./.docu/components/**/*.{js,ts,jsx,tsx}",
    "./.docu/pages/**/*.{js,ts,jsx,tsx}",
    "./docs/**/*.mdx",
  ],
  plugins: [typography],
} satisfies Config;
