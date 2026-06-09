/** @type {import('czg').GlobalOptions} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
        "review",
      ],
    ],
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "header-max-length": [2, "always", 100],
    "body-max-line-length": [0],
    "body-max-length": [0],
  },
  prompt: {
    alias: {
      fd: "docs: fix typos",
      af: "fix: fix something",
    },
    scopes: ["docs", "app", "packages", "cli", "core", "mdx-content", "flame", "template"],
    defaultScope: "empty",
    allowEmptyScopes: true,
    emptyScopesAlias: "empty",
    upperCaseSubject: false,
  },
};

export default config;
