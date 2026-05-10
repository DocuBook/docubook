# Contributing to DocuBook

Thank you for your interest in contributing to DocuBook!

## Quick Contribution Flow

1. **Fork the repository**: Fork the
   [DocuBook repository](https://github.com/DocuBook/docubook/fork) to your GitHub account.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/docubook.git
   cd docubook
   ```
3. **Check existing issues**: Before starting any work, always check the
   [issues](https://github.com/DocuBook/docubook/issues) in the repository. If your idea, bug, or
   feature is not already listed, create a new issue with the appropriate label (e.g., `bug`,
   `feature`, `docs`).
4. **Create a branch**: Once your issue is created, create a branch with a descriptive name based on
   the issue (see branch naming guidelines below).
5. **Install dependencies and validate**:
   ```bash
   pnpm install
   pnpm build
   pnpm lint
   pnpm typecheck
   ```
6. **Make your changes** and add a changeset:
   ```bash
   pnpm changeset
   ```
7. **Open a Pull Request (PR)**: After pushing your branch, open a PR referencing the issue. Do not
   open a PR without an associated issue.

---

## About DocuBook

DocuBook is a documentation platform built as a monorepo to help teams create, manage, and publish
technical docs efficiently.

The project combines a Next.js documentation app, a CLI for scaffolding and project setup, and
reusable packages for MDX processing and docs-tree generation.

In short, DocuBook focuses on fast documentation delivery, clean developer experience, and scalable
open-source release workflows.

## Code of Conduct

Be respectful, constructive, and collaborative.

If you report sensitive issues (security, abuse, private data), avoid public disclosure and contact
maintainers privately first.

## Ways to Contribute

- Report bugs with clear reproduction steps
- Propose features and improvements
- Improve docs, examples, and DX
- Submit pull requests for fixes or enhancements
- Help review issues and PR discussions

## Before You Start

- **Always search existing issues and pull requests before opening a new one.**
- If no similar issue exists, create a new issue with a clear description and the correct label.
- For non-trivial changes, open an issue/discussion first to align scope.
- Keep pull requests focused: one concern per PR.

## Development Setup

This monorepo uses **pnpm workspaces** and includes automated git hooks for consistent development
workflow.

### Requirements

- **Node.js** >= 20.0.0
- **pnpm** >= 11.0.0

### Package Manager

This project is configured to use **pnpm** as the package manager. Using other package managers may
cause workspace resolution issues.

If you have `corepack` enabled, pnpm will be automatically selected:

```bash
corepack enable
corepack prepare pnpm@11.0.0 --activate
```

### Installing Dependencies

```bash
pnpm install
```

### Common Commands

```bash
# Build all packages/apps
pnpm build

# Lint all workspaces
pnpm lint

# Type-check all workspaces
pnpm typecheck

# Clean turbo outputs
pnpm clean
```

### Git Hooks (Husky)

Git hooks are automatically set up via Husky during `pnpm install` (via the `prepare` script). These
hooks enforce code quality standards on every commit.

#### Pre-commit Hook

Runs lint-staged to validate and format staged files:

- **JavaScript/TypeScript/JSX/TSX/MDX**: ESLint + Prettier
- **JSON/MD/MDX**: Prettier check

#### Commit-msg Hook

Validates commit messages using **Commitlint** with
[Conventional Commits](https://www.conventionalcommits.org/) format.

## Project Structure (High Level)

- `apps/web`: Next.js documentation app
- `packages/cli`: CLI scaffold and installer utilities
- `packages/core`: Shared compile/content utilities
- `packages/docs-tree`: docs tree generation package
- `packages/mdx-content`: MDX content helpers
- `template/*`: starter templates

## Branch and Commit Guidelines

- Branch from the default branch
- Use descriptive branch names, for example:
  - `fix/search-modal-focus`
  - `feat/cli-template-update`
  - `docs/improve-installation`

### Commit Message Convention

This project follows the **Conventional Commits** specification. Commit messages must follow this
format:

```
<type>(<scope>): <subject>
```

#### Types

| Type       | Description                                 |
| ---------- | ------------------------------------------- |
| `feat`     | New feature                                 |
| `fix`      | Bug fix                                     |
| `docs`     | Documentation only changes                  |
| `style`    | Code style changes (formatting, semicolons) |
| `refactor` | Code refactoring without feature/fix        |
| `perf`     | Performance improvements                    |
| `test`     | Adding or modifying tests                   |
| `build`    | Build system or dependency changes          |
| `ci`       | CI configuration changes                    |
| `chore`    | Other changes that don't modify src         |
| `revert`   | Reverting a previous commit                 |

#### Scopes

The `scope` is optional but recommended. Common scopes:

| Scope         | Description               |
| ------------- | ------------------------- |
| `app`         | Main application          |
| `packages`    | Package changes (general) |
| `cli`         | CLI package               |
| `core`        | Core package              |
| `mdx-content` | MDX content package       |
| `docs`        | Documentation             |
| `configs`     | Configuration files       |
| `scripts`     | Build/scripts             |

#### Examples

```bash
feat(cli): add new command
fix(core): resolve template rendering issue
docs: update API documentation
refactor(app): simplify navigation logic
chore: update dependencies
```

### Interactive Commit (czg)

For an interactive commit prompt, use:

```bash
pnpm commit
```

This provides a guided interface for writing properly formatted commit messages.

## Pull Request Guidelines

### Before Opening a PR

1. **Read the issues list**: Only open a PR if there is an existing issue describing your change. If
   not, create a new issue first and wait for confirmation or discussion.
2. **Create a branch**: Name your branch according to the issue and guidelines below.
3. **Keep your branch up to date**: Always merge the latest `main` branch into your feature branch
   before opening a PR.

#### How to Merge with `main`

For this repository, **always use merge** to update your branch with the latest `main` before
opening a pull request. This keeps the commit history transparent and avoids rewriting history,
which is safer for open source collaboration.

- **Merge** keeps the full history and creates a new commit that combines changes from both
  branches. The commit graph will show a branch and merge point.

To merge the latest `main` into your branch:

```bash
git fetch origin
git checkout your-branch
git merge origin/main
```

Resolve any conflicts if prompted, then push your branch to your own feature branch (not to `main`):

```bash
git push origin your-branch
```

### PR Title

Use concise, descriptive titles. Conventional style is preferred.

### PR Description

Include:

- What changed
- Why it changed
- Scope and affected package(s)
- Screenshots or terminal output (if relevant)
- Linked issue (for example `Closes #123`)

### Pre-PR Checklist

Before requesting review, ensure:

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] Relevant build/dev flow works locally
- [ ] Docs are updated if behavior changed
- [ ] Changes are scoped and free from unrelated refactors

## Tests and Validation

This repository uses linting, type checking, and real workflow validation as core quality gates.

When touching runtime behavior, validate the affected package/app locally and include verification
notes in the PR.

## Changesets and Releases

This monorepo uses Changesets for versioning and publishing.

For any user-facing package change, add a changeset:

```bash
pnpm changeset
```

### Version Bump Guide

Choose the bump type based on the nature of the change:

| Type    | When to use                                             | Version example   |
| ------- | ------------------------------------------------------- | ----------------- |
| `patch` | Bug fixes and small changes that do not affect the API  | `1.0.0` → `1.0.1` |
| `minor` | New features that are backward-compatible               | `1.0.0` → `1.1.0` |
| `major` | Breaking changes — API is no longer backward-compatible | `1.0.0` → `2.0.0` |

---

<details>
<summary>Workflow: Patch Release (bug fix)</summary>

```bash
# 1. Create a changeset — select the affected package(s) and choose "patch"
pnpm changeset

# 2. Commit the generated changeset
git add .changeset/
git commit -m "chore: add changeset for patch fix"

# 3. Apply version bumps and generate CHANGELOG
pnpm package

# 4. Commit the version bump
git add .
git commit -m "chore: release patch"

# 5. Push your branch and open a Pull Request
git push <branch-name>
```

</details>

---

<details>
<summary>Workflow: Minor Release (new feature)</summary>

```bash
# 1. Create a changeset — select the affected package(s) and choose "minor"
pnpm changeset

# 2. Commit the generated changeset
git add .changeset/
git commit -m "chore: add changeset for new feature"

# 3. Apply version bumps and generate CHANGELOG
pnpm package

# 4. Commit the version bump
git add .
git commit -m "chore: release minor"

# 5. Push your branch and open a Pull Request
git push <branch-name>
```

</details>

---

<details>
<summary>Workflow: Major Release (breaking change)</summary>

```bash
# 1. Create a changeset — select the affected package(s) and choose "major"
pnpm changeset

# 2. Commit the generated changeset
git add .changeset/
git commit -m "chore: add changeset for breaking change"

# 3. Apply version bumps and generate CHANGELOG
pnpm package

# 4. Commit the version bump
git add .
git commit -m "chore: release major"

# 5. Push your branch and open a Pull Request
git push <branch-name>
```

</details>

## Documentation Contributions

Docs improvements are highly encouraged.

Please keep writing concise, example-driven, and consistent with existing tone and file
organization.

## Review Process

- Maintainers review based on correctness, scope, and long-term maintainability
- Feedback is expected and normal in collaborative OSS work
- Be responsive and open to iteration

## Contributor Benefits

Contributing here is not about financial incentives. The core value is helping sustain a healthy
ecosystem and long-term product quality.

By contributing, you help:

- Keep the DocuBook ecosystem reliable for users and teams
- Improve long-term maintainability and reduce technical debt
- Protect release stability through better quality and review culture
- Strengthen shared knowledge through docs, examples, and issue discussions
- Build your open-source track record through meaningful public contributions

## Sponsorship and Fairness

DocuBook welcomes sponsorship and donations to support ongoing maintenance, documentation, and
community activities.

CI/CD is handled through GitHub Actions, and the main documentation site is hosted for free on
Vercel. Sponsor funds are therefore primarily intended to help cover support for active
contributors, community coordination, and domain costs.

Sponsor support is appreciated, but it does not affect the contribution review process. All issues
and pull requests are evaluated on their technical merit, quality, and alignment with project goals.

Sponsor benefits may include:

- public thank-you in the repository or release notes
- access to roadmap summaries or sponsorship updates
- invitation to community channels or sponsor-only briefs

Fairness is a priority:

- everyone gets the same review process
- sponsorship is not a shortcut to merge or priority treatment
- transparency about fund usage builds trust

<!-- prettier-ignore -->
> [!NOTE]
> Because this project has a small maintainer team, the owner may use automated agents like GitHub Copilot and Anthropic Claude for work. Some funds may be used to pay for API token subscriptions needed by those agents.

## Recognition

All meaningful contributions are appreciated, including code, docs, issue triage, and design
feedback.

Thank you for helping improve DocuBook.
