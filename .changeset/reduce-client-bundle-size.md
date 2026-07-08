---
"@docubook/flame": patch
"@docubook/mdx-content": patch
"@docubook/themes-colors": patch
---

Reduce the client bundle size: enable ESM code splitting in both bundlers (Bun `hydrate.ts` and esbuild `hydrate.node.ts`) so dynamic imports like `mermaid` ship as separate on-demand chunks instead of inlining into the single entry file; select the entry output by `kind`/`entryPoint` rather than position. Restrict daisyUI to `light`/`dark` themes (via `@plugin "daisyui"`) instead of importing all ~35 built-in themes. Add immutable `Cache-Control` for hashed `/assets/*` in `vercel.json` and emit a `_headers` file from `flame deploy` for Netlify/Cloudflare Pages.

Fix MDX component borders broken by collision between daisyUI v5's `--border` (border width `1px`) and the project's `--border` (HSL color for `--color-border`). DaisyUI's plugin sets `--border: 1px` on `:root` via `:where(:root)` in every theme block; MDX components use `hsl(var(--border, ...))` for inline border colors, so `--border` resolving to `1px` made `hsl(1px)` invalid and border-color invisible. Rename the project's CSS variable from `--border` → `--border-color` across `globals.css`, `@docubook/themes-colors` theme JSONs, theme fixtures, and all 19 `var(--border)` references in `@docubook/mdx-content` component sources. Also remove `--prefersdark` from the daisyUI plugin config.

Safelist daisyUI dynamic class variants via `@source inline(...)` in `globals.css` so structural classes used by `@docubook/ui-react` components (collapse, breadcrumbs, modal, drawer, navbar, kbd, toggle, input, menu, label) are emitted by Tailwind v4 even though the ui-react package dist is absent and its source builds class names via template literals (`kbd-${size}`, `toggle-${color}`, etc.) that Tailwind cannot statically detect.

Extract the duplicated `cleanOldBundles()` function—identical across both the Bun and esbuild hydration files—into the shared `paths.ts` module.