# ADR-002: Shared MDX Compilation Pipeline as Package

## Status

Accepted

## Context

Each framework (flame, Next.js, react-router) needs to compile MDX files with the same plugin chain: remark-gfm, rehype-prism-plus, rehype-code-titles, custom code-expandable, frontmatter extraction, and TOC generation. Duplicating plugin configurations across frameworks creates drift and maintenance burden.

## Decision

Extract the MDX compilation pipeline into `@docubook/core` as a shared package published to npm.

## Rationale

- **Single source of truth** for plugin ordering and configuration
- **Bug fixes propagate** to all frameworks via version bump
- **Testable in isolation** — unit tests for plugins run without framework overhead
- **Framework-agnostic** — accepts raw MDX string, returns compiled output + metadata

## Consequences

- Frameworks cannot customize the plugin chain without forking or extending core
- Core must remain framework-agnostic (no React, no Next.js, no Bun-specific APIs)
- Breaking changes in core require coordinated releases across all consumers
