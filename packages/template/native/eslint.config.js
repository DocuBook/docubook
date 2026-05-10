import eslint from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import perfectionist from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Base recommended rules
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // React plugin
  {
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
      "perfectionist/sort-classes": [
        "error",
        {
          type: "natural",
          order: "asc",
        },
      ],
      "react-hooks/set-state-in-effect": "warn",
    },
    settings: {
      react: {
        version: "19.0",
      },
    },
  },

  // Files to lint
  {
    files: [".docu/**/*.ts", ".docu/**/*.tsx"],
  },

  // TSX specific
  {
    files: [".docu/**/*.tsx"],
    rules: {
      "react/jsx-no-target-blank": "error",
    },
  },

  // Hooks exhaustive deps
  {
    rules: {
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Ignores
  {
    ignores: [
      "node_modules/**",
      ".docu/dist/**",
      ".docu/build-cache.json",
    ],
  }
);