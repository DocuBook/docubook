# ADR-008: Dual Tailwind CSS Pipeline — CLI for Flame, PostCSS for Next.js

## Status

Accepted

## Context

DocuBook supports two rendering frameworks that use Tailwind CSS 4:

- **`@docubook/flame`** — Bun-powered SSG with no PostCSS pipeline built in. Uses `Bun.build()` for JS and needs a separate CSS build step.
- **Next.js (templates)** — Built-in PostCSS support via `next.config.mjs` and `postcss.config.cjs`.

Options considered:
1. PostCSS for both — requires PostCSS dependency + config in flame, adds complexity
2. Tailwind CLI for both — requires CLI invocation in Next.js build, non-standard
3. **Each framework uses its native Tailwind pipeline** — flame uses `@tailwindcss/cli`, Next.js uses `@tailwindcss/postcss`

## Decision

Use two different Tailwind CSS build pipelines:

| Framework | Pipeline | Command / Config |
|-----------|----------|-----------------|
| **flame** | `@tailwindcss/cli` (via `bun x @tailwindcss/cli`) | `bun x @tailwindcss/cli -i globals.css -o client.css --minify` |
| **Next.js** | `@tailwindcss/postcss` (PostCSS plugin) | `postcss.config.cjs` with `@tailwindcss/postcss` |

**Flame CSS build (in `buildClientBundle()`):**
```typescript
const proc = Bun.spawn([
  "bun", "x", "@tailwindcss/cli",
  "-i", join(STYLES_DIR, "globals.css"),
  "-o", tmpCss, "--minify"
]);
```

**Next.js CSS config (in `postcss.config.cjs`):**
```javascript
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

## Rationale

- **Flame has no PostCSS requirement** — Bun.build handles JS, `@tailwindcss/cli` handles CSS. No extra config files needed.
- **Next.js has built-in PostCSS** — using `@tailwindcss/postcss` is the standard approach for Next.js + Tailwind CSS 4.
- **Output is identical** — both produce standard Tailwind CSS. Theme tokens stay consistent via docu.json.
- **No duplication** — each framework uses its most natural build tool. Flame users don't need to understand PostCSS.

## Consequences

- flame CSS output is content-hashed (`client-{md5}.css`) and written to `dist/assets/`
- Next.js CSS is processed inline by its build pipeline
- Both consume the same `globals.css` with identical `@theme`, `@plugin` directives
- If a third framework needs Tailwind, its pipeline can differ again (Vite uses `@tailwindcss/vite`)
