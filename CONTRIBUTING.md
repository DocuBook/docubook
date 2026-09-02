# Contributing to DocuBook

Thank you for your interest in contributing to DocuBook.

## About DocuBook

DocuBook is a documentation-focused static site generator built as a pnpm
monorepo. The repository contains reusable packages for MDX compilation,
portable React markdown components, theme utilities, UI primitives, and the
`flame` static-site runtime.

For the internal system overview — package responsibilities, runtime model,
build pipeline, deployment, and release decisions — see
[ARCHITECTURE.md](./ARCHITECTURE.md).

## Code of Conduct

Be respectful, constructive, and collaborative. If you need to report a
sensitive issue such as a security problem or private-data exposure, avoid
public disclosure and contact maintainers privately first.

## Ways to Contribute

- report bugs with a clear reproduction
- propose features and improvements
- improve docs, examples, and developer experience
- submit focused pull requests
- help review issues and PR discussions

## Quick Start

1. **Fork the repository**
   - <https://github.com/DocuBook/docubook/fork>
2. **Clone your fork**
   ```bash
   git clone https://github.com/<your-username>/docubook.git
   cd docubook
   ```
3. **Check existing issues and PRs first**
   - If the change is non-trivial, open an issue or discussion before coding.
4. **Create a branch from `main`**
   ```text
   fix/search-modal-focus
   feat/cli-template-update
   chore/migrate-packages-to-vite
   docs/update-architecture
   ```
5. **Install dependencies**
   ```bash
   pnpm install
   ```
6. **Run baseline validation**
   ```bash
   pnpm build
   pnpm lint
   pnpm typecheck
   pnpm test
   ```
7. **Add a changeset for user-facing package changes**
   ```bash
   pnpm changeset
   ```
8. **Open a pull request**
   - Include what changed, why, affected packages, and validation notes.

## Development Setup

### Requirements

- **Node.js** `^20.19.0 || ^22.13.0 || >=24`
- **pnpm** `11.x` (the repo is pinned via `packageManager`)
- **Bun** `>=1.1.0` if you work on `packages/flame` default runtime flows

Enable pnpm with Corepack:

```bash
corepack enable
corepack prepare pnpm@11.10.0 --activate
```

Then install:

```bash
pnpm install
```

### Common Commands

| Command | Purpose |
|---|---|
| `pnpm build` | Build the full workspace via Turborepo |
| `pnpm lint` | Lint the full workspace |
| `pnpm typecheck` | Type-check the full workspace |
| `pnpm test` | Run all workspace tests |
| `pnpm clean` | Clean Turborepo outputs |
| `pnpm commit` | Open the interactive commit prompt |
| `pnpm changeset` | Create a changeset |
| `pnpm version-packages` | Consume changesets and update package versions + changelogs |
| `pnpm publish-packages` | Build and publish versioned packages |

### Working on Individual Packages

Examples:

```bash
pnpm --filter ./packages/core run build
pnpm --filter ./packages/markdown run test
pnpm --filter ./packages/ui-react run typecheck
pnpm --filter ./packages/flame run compile:lib
```

Notes:

- `core`, `markdown`, `themes-colors`, and `ui-react` build with **Vite 8**.
- `flame` uses **Bun** for its main `dev`, `build`, `preview`, and `deploy`
  scripts.
- `flame` uses **Vite 8** for Node/Deno compatibility compilation
  (`compile:lib`) and the Node/Deno browser-bundle path.

## Git Hooks and Local Enforcement

Git hooks are installed by Husky during `pnpm install`.

### Hook Stack

| Tool | Purpose | Source |
|---|---|---|
| [Husky](https://typicode.github.io/husky/) | Installs and runs hooks | `.husky/` |
| [lint-staged](https://github.com/lint-staged/lint-staged) | Formats and lints staged files | `.lintstagedrc.json` |
| [commitlint](https://commitlint.js.org/) | Validates commit messages | `commitlint.config.js` |
| [czg](https://cz-git.qbb.sh/cli/) | Interactive commit prompt and commit-msg hook | `package.json` + `commitlint.config.js` |

### On Every Commit

- `pre-commit` → `pnpm lint-staged`
- `commit-msg` → `pnpm exec czg --hook`

`lint-staged` currently runs:

- `prettier --write --ignore-unknown` on all staged files
- `oxlint` on staged JS/TS files

### On Every Push

`pre-push` runs stricter workspace-wide checks:

1. `pnpm turbo lint`
2. `pnpm turbo build`
3. `pnpm exec commitlint --from ... --to HEAD --verbose`

This means a commit may pass local `pre-commit` checks but still be rejected on
push if:

- the full workspace no longer builds
- lint fails outside your staged files
- an older commit on your branch has an invalid message

## Branch Naming

Create branches from `main` and use a short, descriptive prefix:

- `feat/<short-description>`
- `fix/<short-description>`
- `docs/<short-description>`
- `chore/<short-description>`
- `refactor/<short-description>`
- `ci/<short-description>`

Examples:

```text
feat/add-mermaid-controls
fix/node-runtime-smoke
chore/migrate-packages-to-vite
docs/update-contributing-guide
```

## Commit Guidelines

DocuBook uses **Conventional Commits**.

Format:

```text
<type>(<scope>): <subject>
```

Scope is optional, but recommended when it adds clarity.

Rules enforced by `commitlint.config.js`:

- allowed types:
  - `feat`
  - `fix`
  - `docs`
  - `style`
  - `refactor`
  - `perf`
  - `test`
  - `build`
  - `ci`
  - `chore`
  - `revert`
  - `review`
- subject must be lowercase
- header max length is 100 characters

Examples:

```text
feat(flame): add runtime smoke coverage
fix(core): preserve portable declaration output
docs: update architecture notes
chore: migrate packages to vite 8
```

### Scopes

Scopes are optional. Common examples in this repo:

- `docs`
- `packages`
- `core`
- `flame`

The interactive prompt still includes some historical scope names for legacy
workflows; that does not change the active package names in the codebase.

### Non-Interactive Commits

If you cannot use the interactive prompt in your environment, commit manually.

Preferred when hooks can run normally:

```bash
GIT_EDITOR=true git commit -m "fix(flame): remove esbuild runtime dependency"
```

If your environment cannot satisfy the interactive commit-msg hook, you may need
an escape hatch:

```bash
git commit --no-verify -m "fix(flame): remove esbuild runtime dependency"
```

If you skip hooks locally, run validation yourself before pushing. The push hook
and CI will still enforce lint, build, and commit message rules.

## Pull Request Guidelines

### Before Opening a PR

- rebase on the latest `main`
- keep the PR focused on one concern
- include docs updates when behavior, tooling, or release flow changes
- add a changeset if the change is user-facing

Example rebase flow:

```bash
git fetch origin
git rebase origin/main
git push --force-with-lease origin <your-branch>
```

### PR Title and Body

Preferred PR title style:

- concise
- descriptive
- Conventional Commits style when practical

PR body should include:

- summary of the change
- reason for the change
- affected package(s)
- validation performed
- linked issue or discussion when applicable

### Pre-PR Checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes, or relevant package tests are documented
- [ ] docs are updated when behavior changed
- [ ] changes are scoped and avoid unrelated refactors
- [ ] validation notes are included in the PR body for runtime/tooling changes

## Changesets and Releases

This repository uses [Changesets](https://github.com/changesets/changesets) for
versioning and npm publishing.

### Important Release Behavior

The published packages are **linked** in `.changeset/config.json`:

- `@docubook/core`
- `@docubook/flame`
- `@docubook/markdown`
- `@docubook/themes-colors`
- `@docubook/ui-react`

The repo is also in **prerelease mode** with the `beta` tag.

Practical consequence:

- a user-facing change in one linked package may cause **all linked packages**
  to version and publish together
- release scope is determined by Changesets + linked versioning, not by the
  touched files alone

### When to Add a Changeset

Add a changeset for user-facing changes to published packages:

```bash
pnpm changeset
```

Typical examples:

- behavior changes in `core`, `markdown`, `flame`, `themes-colors`, or `ui-react`
- new exports or removed exports
- runtime/build/deployment changes that affect consumers
- bug fixes visible to users

### Local Versioning Flow

```bash
# create a changeset
pnpm changeset

# commit it
git add .changeset/
git commit -m "chore: add changeset"

# apply versions and changelogs
pnpm version-packages

# commit version updates
git add .
git commit -m "chore: version packages"
```

### CI Release Flow

Release automation lives in `.github/workflows/release.yml`.

On pushes to `main`, the workflow uses `changesets/action` to either:

- open or update a Release PR, or
- publish versioned packages to npm once that Release PR is merged

The publish command is:

```bash
pnpm publish-packages
```

which runs:

```bash
pnpm build && changeset publish
```

After publish, the workflow removes per-package tags and creates a single GitHub
release tag based on flame's version:

```text
v<flame version>
```

## Documentation Contributions

Documentation changes are welcome. Keep them:

- specific
- accurate to the current codebase
- light on marketing language
- explicit about commands, paths, and validation steps

## Review Process

Maintainers review for:

- technical correctness
- scope discipline
- long-term maintainability
- consistency with the existing package and runtime model

Feedback and iteration are normal parts of the process.

## Recognition and Sponsorship

Contributions help keep the DocuBook ecosystem reliable and maintainable.
Sponsorship supports ongoing maintenance and tooling, but does not affect review
fairness or merge priority.

<!-- prettier-ignore -->
> [!NOTE]
> Maintainers may use automated agents during development and review. This does
> not change the repository standards for correctness, documentation, or CI.

Thank you for helping improve DocuBook.
