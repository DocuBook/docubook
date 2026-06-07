# ADR-004: docu.json as Universal Configuration

## Status

Accepted

## Context

Each framework needs route definitions, site metadata, navigation structure, and theme settings. Options:

1. **Framework-specific config** (next.config.js, vite.config.ts) — tightly coupled
2. **Markdown-based** (directory structure = routes) — limited metadata
3. **Universal JSON config** — framework-agnostic, statically analyzable

## Decision

Use `docu.json` as the single configuration file consumed by all frameworks.

## Rationale

- **Framework-agnostic** — same config works across flame, Next.js, and react-router
- **Statically analyzable** — tools can parse routes without executing code
- **Declarative routing** — explicit route tree enables sidebar, pagination, breadcrumb generation
- **CLI compatibility** — `@docubook/cli` can validate and scaffold from docu.json schema
- **No code execution** — safer than JS/TS config files for template distribution

## Consequences

- Dynamic route generation (e.g., from API) is not supported
- Schema must be documented and versioned for backward compatibility
- Each framework implements its own docu.json reader (fs-scanner, generateStaticParams, routes.ts)
