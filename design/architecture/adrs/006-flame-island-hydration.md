# ADR-006: Island Hydration with createRoot (Not hydrateRoot)

## Status

Accepted

## Context

`@docubook/flame` renders static HTML via `renderToString` at build time. Interactive MDX components need client-side React. Initial implementation used `hydrateRoot` but caused persistent hydration mismatches due to:

1. Bun.build `define` not fixing CJS conditional require in `next-mdx-remote`
2. Browser DOM normalization differing from `renderToString` output
3. `lazy: true` + `hydrateRoot` broken in custom SSR

## Decision

Use `createRoot` (full client render) for MDX content islands instead of `hydrateRoot`.

## Rationale

- **Eliminates hydration mismatch** — client renders from scratch, no server/client diff
- **Simpler mental model** — static HTML is placeholder, React takes over completely
- **Bun.build plugin** resolves jsx-runtime via `onLoad` with `loader: "js"` + `contents`
- **Performance acceptable** — MDX islands are small; full page is still static HTML

## Consequences

- Brief flash possible between static HTML and React mount (mitigated by CSS)
- Requires `unsafe-eval` in CSP for MDX evaluation
- `NODE_ENV=production` must be set during build to get production React runtime
- Cannot use `lazy: true` in MDXRemote configuration
