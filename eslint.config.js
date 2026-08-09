import eslint from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// NOTE: We intentionally reference the plugin's flat configs directly instead
// of `tseslint.configs.recommended`. That helper registers candidate
// `tsconfigRootDir` values in module-level state, which makes the ESLint
// language server throw "No tsconfigRootDir was set, and multiple candidate
// TSConfigRootDirs are present" for files it parses without explicit
// `parserOptions.tsconfigRootDir` (e.g. open files in the editor).
export default [
  eslint.configs.recommended,
  ...tsPlugin.configs["flat/recommended"],
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["packages/cli/**/*.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        fetch: "readonly",
        AbortController: "readonly",
        ReadableStream: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.turbo/**", "**/*.config.*"],
  },
];
