<!--
  Sync Impact Report
  ===================
  Version change: 1.0.0 → 1.1.0 (MINOR — package development roadmap)
  Modified principles: None (existing 7 principles unchanged)
  Added sections:
    - Development Cycle Roadmap (Q2 2026: Package Enhancement Initiative)
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ aligned
    - .specify/templates/spec-template.md ✅ aligned
    - .specify/templates/tasks-template.md ✅ aligned
  Follow-up TODOs: none
-->

# DocuBook Constitution

## Core Principles

### I. Monorepo Discipline

All packages (`@docubook/core`, `@docubook/cli`, `@docubook/mdx-content`,
`@docubook/docs-tree`) and apps (`apps/web`) MUST live in this single
monorepo managed by pnpm workspaces and Turborepo.

- Each package MUST have a clear, single responsibility.
- Inter-package dependencies MUST use `workspace:*` protocol.
- A change in a shared package MUST NOT break downstream consumers;
  run `pnpm build && pnpm typecheck` from the root before merging.
- New packages require a documented rationale in their README.

### II. API Stability & Backward Compatibility

Public exports of every `@docubook/*` npm package are a contract with
external consumers.

- Breaking changes MUST follow semver MAJOR bumps via Changesets.
- Every exported symbol MUST have TypeScript types (`declaration: true`).
- Deprecated APIs MUST be marked with `@deprecated` JSDoc and kept for
  at least one minor release cycle before removal.
- The `exports` field in `package.json` is the single source of truth
  for public entry points; internal modules MUST NOT be imported by
  consumers.

### III. TypeScript Strictness

All source code MUST be authored in TypeScript with `strict: true`.

- `any` is forbidden except at validated system boundaries
  (e.g., MDX plugin hooks). Every `any` MUST include a justifying
  comment.
- All packages MUST emit `.js` (not `.jsx`) with `jsx: react-jsx` to
  ensure Turbopack and Next.js resolve internal imports correctly.
- `pnpm typecheck` MUST pass with zero errors before a PR is merged.

### IV. Developer Experience First

DocuBook exists to make documentation easy. Every feature MUST be
evaluated through the lens of the end-user developer.

- CLI scaffolding (`@docubook/cli`) MUST work with a single
  `npx @docubook/cli@latest` invocation — zero mandatory config.
- MDX content components MUST be usable without framework-specific
  boilerplate; the `@docubook/mdx-content` adapter layer handles
  framework integration.
- Error messages MUST be actionable: state what went wrong, why, and
  how to fix it.
- Documentation site (`apps/web`) MUST be responsive, accessible
  (WCAG 2.1 AA), and load under 3 s on a 4G connection.

### V. Quality Gates

Every pull request MUST satisfy these gates before merge:

- `pnpm lint` — zero warnings, zero errors.
- `pnpm typecheck` — zero errors across all workspaces.
- `pnpm build` — successful build of all affected packages.
- Changesets MUST be included for any user-facing change.
- Conventional Commit format is required for all commit messages.
- PRs MUST reference an existing issue and be scoped to a single
  concern.

### VI. Content & MDX Integrity

MDX is the core content format. The compile pipeline
(`@docubook/core`) and component registry (`@docubook/mdx-content`)
MUST guarantee:

- Valid MDX compiles without runtime errors.
- Custom components are registered and rendered consistently across
  frameworks (Next.js today; framework adapters are extensible).
- Table of Contents generation (`toc.ts`), search indexing, and
  docs-tree generation MUST remain deterministic for the same input.
- Markdown/MDX changes MUST be previewable locally via `pnpm dev:web`.

### VII. Simplicity & YAGNI

Prefer the simplest solution that satisfies the requirement.

- Do not add abstractions, utilities, or helper layers for
  single-use operations.
- Do not add dependencies when a small inline implementation
  suffices.
- Configuration surface MUST stay minimal; sensible defaults over
  extensive options.
- Every new feature MUST justify its complexity relative to the
  value it delivers.

## Technology Stack & Constraints

- **Runtime**: Node.js ≥ 20
- **Package Manager**: pnpm ≥ 10 with workspaces
- **Build Orchestrator**: Turborepo
- **Language**: TypeScript 5.x, `strict: true`
- **Web Framework**: Next.js (latest stable, currently 16.x)
- **Styling**: Tailwind CSS + Radix UI primitives
- **Content Format**: MDX via `next-mdx-remote` / custom compile
  pipeline
- **Release Management**: Changesets for versioning, changelogs, and
  npm publishing
- **Deployment**: Vercel (primary), Docker (alternative via
  `template/nextjs-docker`)
- **Supported Templates**: `nextjs-vercel`, `nextjs-docker`,
  `react-router`

## Development Workflow & Quality Gates

1. **Issue First**: Every change starts with a GitHub issue. No PR
   without an associated issue.
2. **Branch Naming**: `feat/…`, `fix/…`, `docs/…` prefixes per
   Conventional Commits scope.
3. **Local Validation**: Before pushing, run:
   ```bash
   pnpm lint && pnpm typecheck && pnpm build
   ```
4. **Changeset**: For any user-facing change, run `pnpm changeset`
   and commit the generated file.
5. **PR Review**: At least one approving review required. Reviewer
   MUST verify constitution compliance.
6. **Merge Strategy**: Merge commits (no force-push / rebase on
   shared branches) to preserve history.
7. **Release**: `pnpm version-packages && pnpm release` publishes
   bumped packages to npm.

## Development Cycle Roadmap: Q2 2026 Package Enhancement Initiative

This section documents the strategic focus areas for the current development
cycle. All work within these areas MUST remain aligned with the Core Principles
above.

### Focus Packages & Objectives

**1. @docubook/core — MDX Pipeline Enhancement**
- Objective: Strengthen MDX compilation pipeline with improved error handling,
  plugin architecture, and performance optimization.
- Constraints: MUST maintain 100% backward compatibility with existing
  compiled outputs; all plugin hooks MUST be documented with examples.
- Quality Gate: `pnpm build && pnpm test` MUST pass with >85% code coverage.
- Deliverables: TypeScript strict mode compliance, enhanced error messages,
  benchmarks for pipeline throughput.

**2. @docubook/mdx-content — Built-In Components Registry**
- Objective: Expand component library with semantic, accessible components
  that leverage Radix UI primitives and Tailwind CSS.
- Constraints: Every component MUST be framework-agnostic (adapter layer
  handles framework differences); components MUST be documented with usage
  examples and Storybook stories.
- Quality Gate: All components MUST pass WCAG 2.1 AA accessibility audit;
  visual regression tests required for all new components.
- Deliverables: Component registry with live documentation, TypeScript
  generics for framework adaptation, Storybook integration.

**3. @docubook/template — Starter Templates**
- Objective: Provide production-ready, opinionated starter templates that
  follow project design system (Radix + Tailwind) and reduce time-to-first-doc.
- Constraints: All templates MUST use consistent UI patterns, styling
  approach, and component compositions; templates MUST scaffold from
  `@docubook/cli` with `npx @docubook/cli@latest init`.
- Quality Gate: Each template MUST be deployable to Vercel and Docker
  with zero configuration changes; accessibility and performance budgets
  MUST be met (Lighthouse ≥90).
- Deliverables: `nextjs-vercel`, `nextjs-docker`, `react-router` templates,
  template validation tests, documentation for extending templates.

**4. @docubook/cli — Scaffold & Command Interface**
- Objective: Build a comprehensive CLI that reduces onboarding friction:
  interactive setup wizard, project scaffolding, and development server
  commands.
- Constraints: Zero mandatory configuration; all prompts MUST have sensible
  defaults; CLI MUST work offline (except npm registry fetch).
- Quality Gate: All commands MUST produce helpful error messages with
  recovery suggestions; CLI MUST complete scaffolding in <30 seconds on
  typical hardware.
- Deliverables: `init`, `dev`, `build`, `preview` commands; interactive TUI
  setup wizard; comprehensive CLI help and examples.

**5. @docubook/docs-tree — Deterministic Cache & Tree Generation**
- Objective: Generate deterministic, cacheable directory trees for docs to
  enable efficient static generation and incremental builds.
- Constraints: Output MUST be deterministic for the same input filesystem;
  cache invalidation strategy MUST be documented and tested;
  tree generation MUST complete in <500ms for 1000+ doc files.
- Quality Gate: Snapshot tests for tree output; cache hit rate tests for
  incremental builds; performance benchmarks with results tracked.
- Deliverables: Deterministic tree generation algorithm, cache layer with
  validation, integration tests with `@docubook/core`.

### Cross-Package Principles for This Cycle

- **API Contracts**: Any new public export from these packages MUST follow
  Principle II (API Stability); breaking changes prohibited without MAJOR
  version bump via Changesets.
- **Developer Experience**: Every feature MUST reduce friction; default
  configurations MUST work for 90% of common use cases (Principle IV).
- **Testing Discipline**: New features MUST include unit + integration tests;
  snapshot tests for deterministic outputs (tree, compiled MDX).
- **Documentation**: Every new feature MUST have a corresponding entry in
  `apps/web/docs/` with code examples and reasoning.

## Governance

This constitution is the highest-authority document for the DocuBook
project. All development practices, code reviews, and architectural
decisions MUST comply with the principles defined above.

- **Amendments** require a PR modifying this file with a clear
  rationale. The version MUST be bumped according to semver:
  - MAJOR: principle removal or incompatible redefinition.
  - MINOR: new principle or materially expanded guidance.
  - PATCH: wording clarifications, typo fixes.
- **Compliance Review**: Every PR reviewer MUST verify that the
  change does not violate any principle listed here.
- **Conflict Resolution**: When a technical decision conflicts with
  a principle, the principle wins unless an amendment is ratified
  first.
- **Runtime Guidance**: See `CONTRIBUTING.md` for day-to-day
  development guidance that operationalizes these principles.

**Version**: 1.1.0 | **Ratified**: 2026-04-09 | **Last Amended**: 2026-04-18
