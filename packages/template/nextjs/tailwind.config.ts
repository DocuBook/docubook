import typography from "@tailwindcss/typography"

const config = {
    darkMode: ["class"],
    content: [
        "./app/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./contents/**/*.{md,mdx}",
        "../../packages/ui/src/**/*.{ts,tsx}",
    ],
    plugins: [typography],
}

export default config
