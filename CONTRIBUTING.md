# Contributing to DocuBook

Thank you for your interest in contributing to DocuBook.

## About DocuBook

DocuBook is a documentation-focused static site generator built as a pnpm
monorepo. The repository contains reusable packages for MDX compilation,
portable React markdown components, theme utilities, UI primitives, and the
`flame` static-site runtime. Official flame plugins live under `plugins/`:
`@docubook/plugin-search-algolia` and `@docubook/plugin-og-image`.

For the internal system overview — package responsibilities, runtime model,
build pipeline, deployment, and release decisions — see
[ARCHITECTURE.md](./ARCHITECTURE.md).

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). Be
respectful, constructive, and collaborative.

Report security problems or private-data exposure privately, as described in
[SECURITY.md](./SECURITY.md), never in a public issue or pull request.

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
   chore/update-dependencies
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

- **Node.js** `^22.22.2 || ^24.15.0 || >=26` (root `engines` range)
- **pnpm** `12.x` (the root `packageManager` field pins the exact version)
- **Bun** `>=1.4.0` for flame's default `dev`, `build`, `preview`, and
  `deploy` scripts; a full-workspace `pnpm build` also requires Bun

Enable pnpm with Corepack:

```bash
corepack enable
```

Corepack reads the `packageManager` pin automatically.

Then install:

```bash
pnpm install
```

### Common Commands

| Command | Purpose |
|---|---|
| `pnpm build` | Build the full workspace via Turborepo |
| `pnpm dev` | Build flame's workspace dependencies, then watch-rebuild them and run the flame dev server (restarts when a dependency rebuilds) |
| `pnpm lint` | Run the root Oxlint configuration across the repository |
| `pnpm typecheck` | Type-check the workspace through Turborepo |
| `pnpm test` | Run workspace tests through Turborepo |
| `pnpm test:release-plan` | Verify the read-only release-plan matrix from `.changeset/config.json` |
| `pnpm test:release-meta` | Test the Release PR title and version commit message builder (`scripts/release-meta.mjs`) |
| `pnpm test:browser-smoke` | Load a built flame site (`packages/flame/.docu/dist`) in headless Chrome and check pages hydrate; set `CHROME_PATH` if Google Chrome is not installed |
| `pnpm clean` | Run every package's clean script through Turborepo |
| `pnpm commit` | Open the interactive commit prompt |
| `pnpm changeset` | Create a changeset |
| `pnpm version-packages` | Consume changesets and update package versions + changelogs |
| `pnpm publish-packages` | Build and publish versioned packages |

### Working on Individual Packages

Examples:

```bash
pnpm --filter @docubook/core run build
pnpm --filter @docubook/markdown run test
pnpm --filter @docubook/ui-react run typecheck
pnpm --filter @docubook/flame run compile:lib
pnpm --filter @docubook/plugin-og-image run test
pnpm turbo build --filter=@docubook/flame...
```

Notes:

- `core`, `markdown`, `themes-colors`, `ui-react`, and both plugins build with
  **Vite 8**.
- `flame` uses **Bun** for its main `dev`, `build`, `preview`, and `deploy`
  scripts.
- `flame` uses **Vite 8** for Node/Deno compatibility compilation
  (`compile:lib`) and the Node/Deno browser-bundle path.
- Turbo `typecheck` and `test` tasks depend on workspace dependency builds;
  direct package commands bypass that ordering.

### Live Development Across Packages

`pnpm dev` runs `turbo dev --filter=@docubook/flame...`: it builds `core`,
`markdown`, `themes-colors` and `ui-react` once, then starts
`vite build --watch --emptyOutDir=false` in each of them (so `tsc`
declarations stay in `dist/`) next to the flame dev server.

Flame loads those packages from their built `dist/`, both for server
rendering and for the browser bundle. When one of them is rebuilt with
different output, the dev server restarts so both sides pick up the change,
and open pages reload once it answers again. Rebuilds that produce identical
output are ignored.

- The restart is handled by `flame dev` itself (`bin/dev-supervisor.mjs`) and
  is only enabled when a sibling package is linked from the workspace, as in
  this repository. Projects that install flame from npm run unchanged.
- `FLAME_DEV_SUPERVISE=0` keeps the dev server in a single process; it then
  logs a hint instead of restarting. `FLAME_DEV_SUPERVISE=1` forces the
  supervisor on.
- Running one watcher by hand works too, e.g.
  `pnpm --filter @docubook/markdown run dev` next to
  `pnpm --filter @docubook/flame run dev`.
- `pnpm-workspace.yaml` is the source of truth for shared dependency overrides
  and native `allowBuilds`. Call out any new install script and required
  `allowBuilds` entry in the PR.

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

- `prettier --write --ignore-unknown` on staged files; `.prettierignore`
  excludes Markdown, MDX, and `pnpm-lock.yaml` (pnpm and Renovate write the
  lockfile in pnpm's own style, so Prettier would rewrite it on every commit)
- check-only `oxlint` on staged `*.{js,ts,jsx,tsx}` files

### On Every Push

`pre-push` runs:

1. `pnpm turbo lint` for package lint scripts (currently flame, ui-react, and
   both plugins)
2. `pnpm turbo build` for the workspace
3. `pnpm exec commitlint --from ... --to HEAD --verbose` for the pushed range

It does not run the root `pnpm lint`, `pnpm typecheck`, or `pnpm test`. Run the
baseline commands before opening a PR. A push can still be rejected when the
workspace no longer builds or any commit in the pushed range has an invalid
message.

### In CI

Pull requests and pushes to `main` run the Turbo `lint`, `typecheck`, `build`,
and `test` matrix on Node.js 22. Build and test jobs install Bun. The
`release-plan` job runs `pnpm test:release-plan` and `pnpm test:release-meta`.
Separate smoke jobs build flame through Node and Deno, including the lazy
`.docu/lib` compilation path, then run `pnpm test:browser-smoke` to load the
built site in headless Chrome. `commitlint.yml` validates every commit in a pull
request.

Branch protection on `main` requires `ci (lint)`, `ci (typecheck)`,
`ci (build)`, `ci (test)`, and `commitlint` on a branch that is up to date
with `main`. It also requires one approving review, and a new push dismisses
earlier approvals. There is no code-owner rule and no `CODEOWNERS` file.

An author cannot approve their own PR, and Renovate PRs and the Release PR are
opened with a maintainer's token. That approval therefore usually comes from
Pullfrog's automated review or from another maintainer. CodeQL also scans each
pull request. Neither CodeQL nor Pullfrog is a required check, but reply in the
thread to each Pullfrog inline comment you act on or decline.

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
chore/update-dependencies
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
- subject must not use sentence case, start case, PascalCase, or uppercase;
  lowercase is recommended
- header max length is 100 characters

Examples:

```text
feat(flame): add runtime smoke coverage
fix(core): preserve portable declaration output
docs: update architecture notes
chore: migrate packages to vite 8
```

### Scopes

Scopes are optional and `commitlint` does not enforce a scope allow-list. The
interactive `czg` prompt currently offers:

- `docs`
- `packages`
- `core`
- `mdx-content`
- `flame`

`mdx-content` is a historical prompt value. Current package scopes are `core`,
`flame`, `markdown`, `themes-colors`, and `ui-react`, plus `plugins` for changes
under `plugins/`; type those manually when they improve clarity, or omit the
scope.

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

## Dependency Updates (Renovate)

Dependencies are updated by self-hosted
[Renovate](https://docs.renovatebot.com/) running in
`.github/workflows/renovate.yml`. Its repository config is
`.github/renovate.json`, and Renovate always reads it from `main`.

### Schedule and Dashboard

- The workflow runs daily at 03:00 UTC and can be dispatched by hand
  (`dryRun`: `disabled`, `full`, `lookup`, `extract`; `logLevel`: `info`,
  `debug`).
- Regular updates are opened on Mondays (`schedule: ["on monday"]`).
  Vulnerability updates (OSV and GitHub alerts) are opened on any day and get
  the `security` label.
- `minimumReleaseAge: "3 days"` holds back a new version until it is 3 days
  old. While it waits, the branch shows a pending `renovate/stability-days`
  status, and the dashboard lists it under "Pending Status Checks".
- The [Dependency Dashboard](https://github.com/DocuBook/docubook/issues/432)
  lists every pending, rate-limited, and open update. Ticking a checkbox there
  creates, unblocks, or rebases that branch on the next run. Dispatch the
  workflow to act on it right away.

### Grouping Rules

| Rule | Result |
|---|---|
| `@docubook/*` | Ignored; workspace packages are versioned by Changesets |
| Minor/patch in `packages/**` and the matching `pnpm-workspace.yaml` pins | One `packages minor and patch dependencies` PR |
| Minor/patch in the root `package.json` | One `root devDependencies` PR |
| `devDependencies` majors in `packages/**` | One `packages devDependencies majors` PR (they do not ship) |
| Runtime and peer majors in `packages/**` | One PR each, so each gets its own changeset |
| React, vitest + `@vitest/*`, changesets toolchain | One PR per group across the workspace |
| Dependencies in `plugins/**` | No area group; one PR per dependency (Renovate's default), except `vitest` + `@vitest/*`, which join the vitest group |
| GitHub Actions minor/patch | One `github actions` PR; majors get one PR each |
| Majors of `pnpm-workspace.yaml` overrides | Disabled; overrides are security floors scoped to one major line or consumer |
| `mermaid>katex` override | Held below 0.19 (`allowedVersions: "<0.19.0"`); 0.x minors are breaking |
| `node` and `@types/node` | Held below 23 (`allowedVersions: "<23"`), the last line that supports the maintainer's macOS 12 |

`postUpdateOptions: ["pnpmDedupe"]` runs `pnpm dedupe` after every lockfile
update. Without it, the `pnpm update --no-save` call that Renovate makes drops
the specifiers that `pnpm-workspace.yaml` overrides set, and
`pnpm install --frozen-lockfile` fails in CI.

### Reviewing Renovate PRs

- Check the diff, not the commit prefix. A PR that changes a `dependencies` or
  `peerDependencies` range in a published `packages/*/package.json` needs a
  changeset pushed to its branch before merging. Renovate titles
  `dependencies` updates `fix(deps)` but peer updates `chore(deps)`, as in the
  `@sentry/bun` peer bump. A PR that only touches `devDependencies`, root
  tooling, workflows, or the lockfile needs no changeset.
- Branch protection requires branches to be up to date with `main`, so
  Renovate rebases its unmodified branches whenever they fall behind `main`.
  That includes regenerating `pnpm-lock.yaml` after another lockfile PR merges.
  The rebase happens on the next run, which you can trigger by dispatching the
  workflow.
- Once anyone else pushes to a Renovate branch, Renovate stops rebasing it.
  Keep that branch up to date yourself.
- Validate config changes outside the repository, for example
  `cd /tmp && npx -y -p renovate renovate-config-validator --strict <repo>/.github/renovate.json`.

### Token Permissions

The workflow uses the `RENOVATE_TOKEN` secret, a fine-grained PAT. It falls
back to `GITHUB_TOKEN`, which cannot open PRs that edit workflows. The PAT
needs read and write access to **Contents**, **Pull requests**, **Issues**,
**Commit statuses**, and **Workflows**, plus read access to **Dependabot
alerts**. Without Commit statuses, Renovate creates the first branch, fails to
set `renovate/stability-days`, and aborts with `Repository has changed during
renovation`, so no PR opens. The same token opens the Release PR (see below).

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

`@docubook/plugin-search-algolia` and `@docubook/plugin-og-image` are outside
that group and versioned on their own. They declare `@docubook/flame` as a peer,
so a major flame release pulls them in with a patch bump. npm trusted publishing
cannot create a new package, so a new plugin's first release is published by
hand before `release.yml` can publish it.

The repository is currently in stable release mode; `.changeset/pre.json` is
absent. Prerelease mode and tags must be entered explicitly before documenting
or publishing another prerelease series.

Practical consequence:

- linking aligns versions between the packages that belong to the **same**
  release; it does not version and publish the whole group
- a package without a changeset is published only when a dependency's new
  version leaves the range it declares, and then with a patch bump; Changesets 3
  treats peer dependencies the same way (Changesets 2 forced a major bump on
  peer dependents unless an experimental option was set, see #403)
- release scope is determined by the changesets plus dependency propagation, not
  by the touched files alone
- the resulting plan can be inspected before opening a PR with
  `pnpm test:release-plan` (read-only; it never versions or publishes)

### When to Add a Changeset

Add a changeset for user-facing changes to published packages:

```bash
pnpm changeset
```

Typical examples:

- behavior changes in `core`, `markdown`, `flame`, `themes-colors`, `ui-react`,
  or a plugin under `plugins/`
- new exports or removed exports
- runtime/build/deployment changes that affect consumers
- bug fixes visible to users

### Local Versioning Flow

The Release PR (see below) normally does this. Run it locally only to preview
versions and changelogs, or when releasing by hand:

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

The Release PR is opened with the `RENOVATE_TOKEN` secret (a maintainer PAT),
so CI runs on it without approving workflows for `github-actions[bot]`.
Packages are published with npm trusted publishing: the workflow's OIDC token
is exchanged for a publish token and provenance is attached, so no npm token is
stored. Each `@docubook/*` package lists `DocuBook/docubook` and `release.yml`
as its trusted publisher on npmjs.com, with direct `npm publish` allowed.

`scripts/release-meta.mjs` names the Release PR and its version commit from the
pending changesets: `chore: v<flame version> - <subject>`, where the subject is
the first sentence of the changeset with the largest bump, and the commit body
has one `- <package> (<bump>): <first sentence>` line per changeset. Preview it
with `node scripts/release-meta.mjs --print`.

The publish command is:

```bash
pnpm publish-packages
```

which runs:

```bash
pnpm build && changeset publish
```

The action does not create per-package GitHub releases or push per-package
tags (`create-github-releases: false`, `push-git-tags: false`). After publish,
the workflow deletes the `@docubook/*@<version>` tags that `changeset publish`
creates locally, and creates one product release tag based on flame's version:

```text
v<flame version>
```

That product release runs only when `@docubook/flame` is part of the published
packages; a release that ships other packages only stops after the npm publish,
so flame's unchanged version is never retagged.

It then triggers `.github/workflows/docker-builder.yml`, which publishes the
flame builder image to GHCR as `<version>`, `<major>`, and `latest` from
`packages/flame/docker/Dockerfile.builder`.

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
