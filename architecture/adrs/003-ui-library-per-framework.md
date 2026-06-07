# ADR-003: DaisyUI for SSG/SSR, Radix UI for Next.js

## Status

Accepted

## Context

DocuBook supports multiple rendering strategies. The UI component library must align with each framework's constraints:

- **flame** (SSG): Minimal JavaScript, static HTML output
- **react-router** (SSR): Server-rendered, no RSC, minimal client JS
- **Next.js** (ISR/SSG): Rich interactivity, client components available

## Decision

- Use **DaisyUI** (CSS-only Tailwind components) for flame and react-router
- Use **Radix UI** (headless React primitives) + shadcn pattern for Next.js apps

## Rationale

- **DaisyUI** requires zero JavaScript for most components — ideal for static/SSR where bundle size matters
- **Radix UI** provides accessible, composable primitives for complex interactions (dropdowns, dialogs, popovers) needed in the production site
- Both use Tailwind CSS underneath, keeping the styling approach consistent
- `cn()` utility shared across all frameworks for class merging

## Consequences

- Component implementations differ between flame/react-router and Next.js (not directly portable)
- `@docubook/mdx-content` components must be framework-agnostic (vanilla React + CSS classes)
- Design tokens (colors, spacing) stay consistent via shared Tailwind config
