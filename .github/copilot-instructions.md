# DocuBook – Copilot Instructions

## Build, lint, and validation commands

Run from the monorepo root unless a section says otherwise:

```bash
pnpm dev                     # Run all Turborepo dev tasks
pnpm dev:web                 # Run only the Next.js docs app
pnpm build                   # Build the workspace
pnpm lint                    # Lint all packages/apps with Turbo
pnpm lint:fix                # Auto-fix lint issues where scripts exist
pnpm typecheck               # Run workspace type-check tasks
pnpm format                  # Prettier write
pnpm format:check            # Prettier check
pnpm clean                   # Remove Turbo outputs
```

Target a single workspace from the root with pnpm filters:

```bash
pnpm --filter docubook build
pnpm --filter docubook lint
pnpm --filter @docubook/cli lint
pnpm --filter @docubook/ui typecheck
```

Direct workspace commands:

```bash
# apps/web
cd apps/web && pnpm dev
cd apps/web && pnpm build
cd apps/web && pnpm lint

# packages/cli
cd packages/cli && pnpm dev
cd packages/cli && pnpm lint
```

There is currently no automated test script configured in the workspace packages, so there is no
full-suite or single-test command to run yet.

## High-level architecture

This repository is a pnpm + Turborepo monorepo. The main product is the Next.js docs site in
`apps/web`; `packages/cli` is a separate terminal tool for scaffolding/managing DocuBook projects;
`packages/eslint-config` and `packages/typescript-config` provide shared tooling presets.

For the web app, `apps/web/docu.json` is the main source of truth for docs navigation and site
configuration. It drives navbar items, footer data, metadata, repository edit links, search mode,
and the docs route tree. `apps/web/lib/routes.ts` exports that tree as `ROUTES` and also flattens it
into `page_routes`, which powers prev/next pagination and related navigation.

Docs pages are rendered through the catch-all route `apps/web/app/docs/[[...slug]]/page.tsx`. That
page calls helpers in `apps/web/lib/markdown.ts`, which resolve each slug to either
`apps/web/docs/{slug}.mdx` or `apps/web/docs/{slug}/index.mdx`, parse YAML frontmatter, compile the
MDX with `next-mdx-remote/rsc`, extract the table of contents, and expose the source file path for
the "Edit this page" link.

The MDX pipeline in `apps/web/lib/markdown.ts` is where custom markdown components are wired in. It
overrides `pre`, `img`, `a`, and table elements globally, and also registers DocuBook-specific
components such as `Note`, `Card`, `Accordion`, `Stepper`, `Release`, `FileTree`, and `Outlet`.

App-wide layout flows through `apps/web/app/layout.tsx`, which wraps the site in `ThemeProvider`,
`SearchProvider`, navbar, and footer. The docs section adds `Leftbar` and `DocsNavbar` in
`apps/web/app/docs/layout.tsx`. Search behavior is config-driven: `apps/web/lib/search/config.ts`
reads `docu.json`, and the Algolia keys come from `NEXT_PUBLIC_ALGOLIA_DOCSEARCH_*` environment
variables.

The CLI package is independent of the Next app. `packages/cli/src/index.js` is the executable entry
point, and the terminal UI is split under `packages/cli/src/tui/` for color tokens, ASCII banners,
render helpers, and boxed messages.

## Key conventions

- Keep docs content under `apps/web/docs/`, and keep the file paths aligned with `docu.json` route
  `href` segments. A page can live at either `docs/{slug}.mdx` or `docs/{slug}/index.mdx`.
- Doc frontmatter is expected to provide `title`, `description`, `image`, and `date`. `page.tsx`
  uses it for metadata, page headers, publish date, and OG image generation.
- When adding a new MDX component, create it under `apps/web/components/markdown/` and register it
  in the `components` map in `apps/web/lib/markdown.ts`; adding the component file alone is not
  enough.
- `noLink: true` route groups in `docu.json` are section containers rather than standalone pages.
  The `Outlet` MDX component is used to render cards for child routes of those sections.
- UI primitives in `apps/web/components/ui/` follow the Radix + CVA pattern: native element props,
  `asChild` via `Slot`, class composition through `cn()`, and `displayName` set on `forwardRef`
  components.
- Prefer Server Components by default in the Next app. Add `"use client"` only when a component
  needs hooks, browser APIs, or interactive handlers.
- Tailwind class merging goes through `apps/web/lib/utils.ts` via `cn()`, which wraps `clsx` and
  `tailwind-merge`.
- In the CLI package, stay with ES modules, reuse ANSI colors from `packages/cli/src/tui/colors.js`,
  and keep banners/boxed terminal output centralized in `packages/cli/src/tui/ascii.js` instead of
  inlining escape codes in command handlers.
