# Contributing to DocuBook

Thank you for your interest in contributing to DocuBook!

## About DocuBook

DocuBook is an open-source documentation platform that compiles MDX content into production-ready
documentation websites. It uses a monorepo structure with **pnpm workspaces**, **Turborepo**, and
**Changesets**.

For a detailed architecture overview — package responsibilities, data flow, deployment, and design
decisions — see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Code of Conduct

Be respectful, constructive, and collaborative. If you report sensitive issues (security, abuse,
private data), avoid public disclosure and contact maintainers privately first.

## Ways to Contribute

- Report bugs with clear reproduction steps
- Propose features and improvements
- Improve docs, examples, and developer experience
- Submit pull requests for fixes or enhancements
- Help review issues and PR discussions

## Quick Start

1. **Fork the repository** — [DocuBook repo](https://github.com/DocuBook/docubook/fork)
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/docubook.git
   cd docubook
   ```
3. **Check issues first** — always search [existing issues](https://github.com/DocuBook/docubook/issues)
   and PRs before opening a new one. If your concern isn't listed, create an issue with the
   appropriate label (`bug`, `feature`, `docs`, etc.). For non-trivial changes, open an
   issue/discussion first to align scope.
4. **Create a branch** — use a descriptive name:
   ```
   fix/search-modal-focus
   feat/cli-template-update
   docs/improve-installation
   ```
5. **Install and validate**:
   ```bash
   pnpm install
   pnpm build
   pnpm lint
   pnpm typecheck
   ```
6. **Make your changes** and add a changeset if your change is user-facing:
   ```bash
   pnpm changeset
   ```
7. **Open a Pull Request** — reference the issue in your PR description. Do not open a PR without
   an associated issue.

---

## Development Setup

### Requirements

- **Node.js** >= 20.0.0
- **pnpm** >= 11.0.0

This project uses **pnpm** exclusively. Using other package managers may cause workspace resolution
issues. Enable with corepack:

```bash
corepack enable
corepack prepare pnpm@11.0.0 --activate
```

Then install:

```bash
pnpm install
```

### Common Commands

|         Command         |                       Purpose                        |
| ----------------------- | ---------------------------------------------------- |
| `pnpm build`            | Build all packages                                   |
| `pnpm lint`             | Lint all workspaces                                  |
| `pnpm typecheck`        | Type-check all workspaces                            |
| `pnpm clean`            | Clean turbo outputs                                  |
| `pnpm commit`           | Interactive commit prompt (czg)                      |
| `pnpm version-packages` | Consume changesets, bump versions, update CHANGELOGs |

### 🔒 Git Hooks

Four tools work together through git hooks — every commit and push must pass before it is
accepted:

|                           Tool                            |                   Purpose                   |          File          |
| --------------------------------------------------------- | ------------------------------------------- | ---------------------- |
| [Husky](https://typicode.github.io/husky/)                | Installs hooks during `pnpm install`        | `.husky/`              |
| [lint-staged](https://github.com/lint-staged/lint-staged) | Formats + lints staged files on commit      | `.lintstagedrc.json`   |
| [commitlint](https://commitlint.js.org/)                  | Validates commit messages                   | `commitlint.config.js` |
| [czg](https://cz-git.qbb.sh/cli/)                         | Interactive commit prompt + commit-msg hook | `commitlint.config.js` |

#### On Every Commit

|     Hook     |                  Runs                  |         Scope          |
| ------------ | -------------------------------------- | ---------------------- |
| `pre-commit` | `pnpm lint-staged` (Prettier + ESLint) | Staged files only      |
| `commit-msg` | `czg --hook` (commitlint)              | Current commit message |

#### On Every Push (`pre-push`) — Stricter

> Pre-push validates the **entire workspace** and **all commits** since last push, not just staged
> files. A commit can pass pre-commit but be rejected on push.

|    Hook    |                               Actions                                |
| ---------- | -------------------------------------------------------------------- |
| `pre-push` | `pnpm turbo lint` → `pnpm turbo build` → `commitlint --from @{push}` |

Enforced rules:
- Every commit message follows Conventional Commits format (see [Commit Guidelines](#commit-guidelines))
- Full workspace passes lint and build
- All commits since last push are validated — rebase to fix older messages

#### Non-Interactive Environments (CI & Agents)

`pnpm commit` and `commit-msg` both run **czg**, which requires a TTY. When committing
non-interactively:

```bash
# Write the message manually with --no-verify (skips hooks + lint-staged)
git commit --no-verify -m "<type>(<scope>): <subject>"

# Check formatting yourself before pushing
pnpm exec prettier --check <changed-files>
```

Skipping local hooks does not skip CI — commitlint and workspace lint still run on every PR.

#### Why So Strict?

- Consistent, readable git history across all contributors
- Catch formatting and lint issues before they reach CI
- Every commit message is release-ready for changelog generation

---

## Commit Guidelines

### Branch Naming

Branch from `main` and use descriptive names:

```
fix/<short-description>
feat/<short-description>
docs/<short-description>
```

### Commit Message Format

This project follows **Conventional Commits**. Every message must follow:

```
<type>(<scope>): <subject>
```

**Subject must be lowercase** and **max 100 characters**.

|                ✅ Good                |                 ❌ Bad                |
| ------------------------------------- | ------------------------------------- |
| `feat(cli): add new template command` | `feat(cli): Add new template command` |
| `fix(core): resolve rendering issue`  | `fix(core): RESOLVE RENDERING ISSUE`  |

#### Types

`feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `build` | `ci` | `chore` | `revert` | `review`

#### Scopes (optional but recommended)

`docs` — Documentation &nbsp;&middot;&nbsp; `packages` — General package changes<br>
`cli` — CLI package &nbsp;&middot;&nbsp; `core` — Core package<br>
`mdx-content` — MDX content &nbsp;&middot;&nbsp; `flame` — Framework<br>
`template` — Starter templates (deprecated)

#### Examples

```
feat(cli): add new template command
fix(core): resolve template rendering issue
docs: update API documentation
refactor(flame): simplify navigation logic
```

For an interactive prompt, use `pnpm commit` (requires a TTY).

---

## Pull Request Guidelines

### Before Opening a PR

1. **Only open a PR if there is an existing issue** describing your change. If not, create one first
   and wait for discussion.
2. **Rebase your branch on the latest `main`** before opening a PR — keeps history linear and
   avoids merge commits that would fail `commitlint`.

   ```bash
   git fetch origin
   git rebase origin/main
   git push --force-with-lease origin your-branch
   ```

3. Keep PRs focused — one concern per PR.

### PR Title & Description

- **Title**: concise, descriptive. Conventional Commits style preferred.
- **Description**: what changed, why, affected package(s), screenshots if relevant, and the linked
  issue (`Closes #123`).

### Pre-PR Checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] Relevant build/dev flow works locally
- [ ] Docs updated if behavior changed
- [ ] Changes are scoped, no unrelated refactors
- [ ] Verification notes included in PR if runtime behavior changed

---

## Changesets & Releases

This monorepo uses [Changesets](https://github.com/changesets/changesets) for versioning and
publishing. For any user-facing package change, add a changeset:

```bash
pnpm changeset
```

Then `pnpm version-packages` consumes pending changesets, bumps versions, and updates
CHANGELOGs.

### Bump Types

| Type | When | Version |
|------|------|---------|
| `patch` | Bug fixes, small changes that don't affect the API | `1.0.0` → `1.0.1` |
| `minor` | New features, backward-compatible | `1.0.0` → `1.1.0` |
| `major` | Breaking API changes | `1.0.0` → `2.0.0` |

### Standard Workflow

The same steps apply regardless of bump type — only the changeset selection and commit message
differ:

```bash
# 1. Create a changeset — select affected packages and choose patch/minor/major
pnpm changeset

# 2. Commit the generated changeset
git add .changeset/
git commit -m "chore: add changeset for <patch|minor|major> change"

# 3. Apply version bumps and generate CHANGELOG
pnpm version-packages

# 4. Commit the version bump
git add .
git commit -m "chore: release <patch|minor|major>"

# 5. Push and open a PR
git push <branch-name>
```

### Documentation Contributions

Docs improvements and examples are highly encouraged. Keep writing concise, example-driven, and
consistent with the existing tone.

---

## Review Process

- Maintainers review based on correctness, scope, and long-term maintainability
- Feedback is expected and normal in collaborative OSS work
- Be responsive and open to iteration

---

## Recognition & Sponsorship

### Impact of Your Contribution

By contributing, you help:
- Keep the DocuBook ecosystem reliable for users and teams
- Improve long-term maintainability and reduce technical debt
- Strengthen shared knowledge through docs, examples, and issue discussions
- Build your open-source track record through meaningful public contributions

### Sponsorship

DocuBook welcomes sponsorship to support maintenance, documentation, and community activities.

**Fairness is a priority** — sponsorship does not affect the review process:
- Everyone gets the same review process
- Sponsorship is not a shortcut to merge or priority treatment
- All issues and PRs are evaluated on technical merit and project alignment

Sponsor benefits may include: public thank-you, roadmap summaries, community channel access.

<!-- prettier-ignore -->
> [!NOTE]
> Because this project has a small maintainer team, the owner may use automated agents (GitHub
> Copilot, Claude, etc.) for development. Some funds may be used for API token subscriptions.

---

*Thank you for helping improve DocuBook.*
