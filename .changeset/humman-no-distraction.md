---
"@docubook/flame": patch
---

fix(html.ts): depth-aware relative asset paths for subfolder/static hosting

- Add `depth` option to `HtmlShellOptions` interface and `htmlShell()` (default 0)
- Compute `depthPrefix` and `assetPrefix` based on depth: `""` at root, `"../".repeat(depth)` for subdirs
- Add `resolvePath()` helper to convert absolute paths (starting with `/`) to relative using depth prefix
- Change CSS `<link>` href from `"/assets/${css}"` to `"${assetPrefix + css}"`
- Change JS `<script>` src from `"/assets/${js}"` to `"${assetPrefix + js}"`
- Change favicon `<link>` href from raw value to `resolvePath(favicon)` with conditional rendering (skip when empty)
- Favicon fallback updated from `/favicon.ico` to `/docs/assets/images/favicon.ico` to match template scaffold location

fix(build.ts): calculate and pass page depth to htmlShell

- Compute `depth = slug.split("/").length` for docs pages, default `1` for index page
- Pass `depth` to `htmlShell()` call in `renderDocsPage()`
- Update favicon fallback for landing and 404 pages to `/docs/assets/images/favicon.ico`

fix(Lucide.tsx): resolve TypeScript error with lucide-react Icon type

- Add `as unknown as` intermediate cast for `LucideIcons` index access to satisfy stricter lucide-react 1.18 types

fix(Search.tsx): correct Kbd size prop value

- Change `size="s"` to `size="sm"` across 3 occurrences (KbdSize = `"xs" | "sm" | "md" | "lg" | "xl"`)

fix(plugin.ts): add missing DocuConfig type re-export

- Add `export type { DocuConfig }` so `plugin-builder.ts` can import it from `./plugin`

fix(server-routes.ts): align inlineThemeCss field type

- Change `inlineThemeCss: string` to `inlineThemeCss?: string` to match `computeInlineThemeCss()` return type

fix(server.ts): add non-null assertions for DevServerContext

- Add `server.port!` and `server.hostname!` since bun-types 1.3.14 defines these as `number | undefined` / `string | undefined`

fix(package.json): add unified dependency and align react version

- Add `"unified": "^11.0.0"` as direct dependency (was previously only a transitive dependency)
- Bump `react` from `^19.0.0` to `^19.2.7` for consistent resolution with @docubook/ui-react
- Bump `react-dom` from `^19.0.0` to `^19.2.7`
