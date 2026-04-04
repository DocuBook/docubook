# Contributing to DocuBook

Language: EN | [IN](CONTRIBUTING.id.md)

Thanks for your interest in contributing to DocuBook.

DocuBook is a documentation platform built as a monorepo to help teams create, manage, and publish technical docs efficiently.

The project combines a Next.js documentation app, a CLI for scaffolding and project setup, and reusable packages for MDX processing and docs-tree generation.

In short, DocuBook focuses on fast documentation delivery, clean developer experience, and scalable open-source release workflows.

## Code of Conduct

Be respectful, constructive, and collaborative.

If you report sensitive issues (security, abuse, private data), avoid public disclosure and contact maintainers privately first.

## Ways to Contribute

- Report bugs with clear reproduction steps
- Propose features and improvements
- Improve docs, examples, and DX
- Submit pull requests for fixes or enhancements
- Help review issues and PR discussions

## Before You Start

- Search existing issues and pull requests before opening a new one
- For non-trivial changes, open an issue/discussion first to align scope
- Keep pull requests focused: one concern per PR

[!NOTE]
Because this project has a small maintainer team, the owner may use automated agents like GitHub Copilot and Anthropic Claude for work. Some funds may be used to pay for API token subscriptions needed by those agents.

## Development Setup

### Requirements

- Node.js `>=18`
- `pnpm` `>=10`

### Install

```bash
pnpm install
```

### Common Commands

```bash
# Build all packages/apps
pnpm build

# Run web app in development
pnpm dev:web

# Lint all workspaces
pnpm lint

# Type-check all workspaces
pnpm typecheck

# Clean turbo outputs
pnpm clean
```

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
- Prefer Conventional Commit style:
  - `feat: add docs-tree cache`
  - `fix(cli): handle invalid template name`
  - `docs: clarify release steps`

## Pull Request Guidelines


### Keep Your Branch Up to Date

Before opening a pull request, **make sure your branch is rebased or merged with the latest `main` branch**. This helps avoid conflicts and ensures a smooth integration.

#### How to Merge with `main`
##### Always Use Merge to Update Your Branch

For this repository, **always use merge** to update your branch with the latest `main` before opening a pull request. This keeps the commit history transparent and avoids rewriting history, which is safer for open source collaboration.

- **Merge** keeps the full history and creates a new commit that combines changes from both branches. The commit graph will show a branch and merge point.

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

When touching runtime behavior, validate the affected package/app locally and include verification notes in the PR.

## Changesets and Releases

This monorepo uses Changesets for versioning and publishing.

For any user-facing package change, add a changeset:

```bash
pnpm changeset
```

Then follow the release flow documented in [README.md](README.md).

## Documentation Contributions

Docs improvements are highly encouraged.

Please keep writing concise, example-driven, and consistent with existing tone and file organization.

## Review Process

- Maintainers review based on correctness, scope, and long-term maintainability
- Feedback is expected and normal in collaborative OSS work
- Be responsive and open to iteration

## Contributor Benefits

Contributing here is not about financial incentives. The core value is helping sustain a healthy ecosystem and long-term product quality.

By contributing, you help:

- Keep the DocuBook ecosystem reliable for users and teams
- Improve long-term maintainability and reduce technical debt
- Protect release stability through better quality and review culture
- Strengthen shared knowledge through docs, examples, and issue discussions
- Build your open-source track record through meaningful public contributions

## Sponsorship and Fairness

DocuBook welcomes sponsorship and donations to support ongoing maintenance, documentation, and community activities.

CI/CD is handled through GitHub Actions, and the main documentation site is hosted for free on Vercel. Sponsor funds are therefore primarily intended to help cover support for active contributors, community coordination, and domain costs.

Sponsor support is appreciated, but it does not affect the contribution review process. All issues and pull requests are evaluated on their technical merit, quality, and alignment with project goals.

Sponsor benefits may include:

- public thank-you in the repository or release notes
- access to roadmap summaries or sponsorship updates
- invitation to community channels or sponsor-only briefs

Fairness is a priority:

- everyone gets the same review process
- sponsorship is not a shortcut to merge or priority treatment
- transparency about fund usage builds trust

## Recognition

All meaningful contributions are appreciated, including code, docs, issue triage, and design feedback.

Thank you for helping improve DocuBook.
