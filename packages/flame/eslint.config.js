import eslint from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import perfectionist from "eslint-plugin-perfectionist";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// NOTE: We reference the plugin's flat configs directly instead of
// `tseslint.configs.recommended`. That helper registers candidate
// `tsconfigRootDir` values in module-global state, which makes the ESLint
// language server throw "No tsconfigRootDir was set, and multiple candidate
// TSConfigRootDirs are present". Combined with the explicit
// `parserOptions.tsconfigRootDir` below, .docu files always parse with a
// known root regardless of editor LSP behavior.
export default [
  eslint.configs.recommended,
  ...tsPlugin.configs["flat/recommended"],

  {
    // CLI entry points and this config are plain JS, but the editor language
    // server still parses them with the TypeScript parser — give them an
    // explicit tsconfigRootDir so it never falls back to inference (which
    // throws when multiple candidate roots are present).
    files: ["bin/**/*.js", "bin/**/*.mjs", "eslint.config.js"],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },

  {
    files: [".docu/**/*.ts", ".docu/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      perfectionist,
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/globals": "off",
      "react-hooks/refs": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/set-state-in-render": "off",
      "react-hooks/static-components": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/config": "off",
      "react-hooks/gating": "off",
      "react-hooks/unsupported-syntax": "off",
      "react-hooks/incompatible-library": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "perfectionist/sort-classes": ["error", { type: "natural", order: "asc" }],
    },
    settings: {
      react: { version: "19.0" },
    },
  },

  {
    files: [".docu/**/*.tsx"],
    rules: {
      "react/jsx-no-target-blank": "error",
    },
  },

  {
    files: [".docu/__tests__/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  {
    ignores: [
      "node_modules/**",
      ".docu/dist/**",
      ".docu/lib/**",
      ".docu/build-cache.json",
      "tailwind.config.ts",
    ],
  },
];
