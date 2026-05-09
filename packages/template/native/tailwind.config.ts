import type { Config } from "tailwindcss";

export default {
  content: [
    "./.docu/components/**/*.{js,ts,jsx,tsx}",
    "./docs/**/*.mdx",
  ],
} satisfies Config;