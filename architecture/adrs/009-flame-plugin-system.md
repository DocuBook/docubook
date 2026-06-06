# ADR-009: Plugin System Architecture

## Status

Accepted (2026-06-06)

## Context

`@docubook/flame` is a Bun SSG framework used for production documentation sites. Users increasingly need to extend flame without forking the framework — generating sitemaps, injecting analytics, supporting Algolia search indexing, adding reading-time estimates, or transforming HTML per-page.

Without a plugin system, users either:
1. Fork flame and maintain custom patches (high maintenance burden)
2. Implement their extensions as post-build shell scripts (fragile, no access to page metadata)
3. Send feature requests for every extension (blocks innovation)

The plugin system must balance extensibility with minimal surface area — most sites don't need plugins.

## Decision

Implement a **hook-based plugin system** with a `PluginRunner` class that integrates at 9 points in the build pipeline and dev server:

### Plugin Interface

```typescript
interface DocuBookPlugin {
  name: string;
  buildStart?(config: DocuConfig): void | Promise<void>;
  buildEnd?(config: DocuConfig, pages: PageMeta[]): void | Promise<void>;
  transformFrontmatter?(fm: Record<string, unknown>, ctx: PageContext): Record<string, unknown> | void;
  transformHtml?(html: string, ctx: PageContext): string | Promise<string>;
  injectHead?(ctx: PageContext): string | string[];
  injectBody?(ctx: PageContext): string | string[];
  remarkPlugins?(): Pluggable[];
  rehypePlugins?(): Pluggable[];
  handleRequest?(req: Request, ctx: DevServerContext): Response | void | Promise<Response | void>;
}
```

### Key Design Choices

| Concern | Decision | Rationale |
|---------|----------|-----------|
| **Execution order** | Sequential (waterfall) — array order in `docu.json` | Predictability; plugin count is expected <5 |
| **Error handling** | Fail-fast — plugin error = build error, logs plugin name | Prevents silent failures; plugins are trusted code |
| **Duplicate plugins** | Allowed (user responsibility) | Simpler than dedup logic |
| **Plugin resolution** | `import()` — npm package or relative path | Bun-native, no bundler compat needed |
| **Options passing** | Factory pattern: `export default function(options?)` | Type-safe options at config time |
| **`handleRequest` chaining** | First-response-wins (not middleware `next()`) | Simple mental model; return `Response` to short-circuit |
| **`enforce: pre/post`** | Not implemented — array order only | KISS; Vite-level ordering is over-engineered for flame |
| **Build cache access** | Not exposed — plugins are stateless | Avoids coupling to internal cache format |
| **Config schema** | Runtime validation only — no JSON Schema per plugin | Over-engineered for v1; plugins validate their own options |

### Integration Points

```
Build Pipeline                          Dev Server
├─ [1] loadPlugins(config.plugins)      ├─ [1] loadPlugins(config.plugins)
├─ [2] buildStart(config)               ├─ [2] handleRequest(req, ctx)
├─ for each MDX:                        ├─ HMR / static / router
│  ├─ [3] transformFrontmatter()        ├─ renderDocsPage()
│  ├─ [4] remarkPlugins()               │  └─ [3-8] same hooks as build
│  ├─ [5] rehypePlugins()              └─ response
│  ├─ [6] injectHead()
│  ├─ [7] injectBody()
│  └─ [8] transformHtml()
└─ [9] buildEnd(config, pages)
```

### Resolution Rules

```jsonc
// docu.json
{ "plugins": [
    "@docubook/plugin-sitemap",                    // string = no options
    ["@docubook/plugin-analytics", { "id": "G-XXX" }],  // factory with options
    "./plugins/my-plugin"                           // relative path
] }
```

1. String → `require(name).default` (no options)
2. `[string, object]` → `require(name).default(options)` (factory)
3. Relative path `./...` → resolve from project root
4. Missing export or missing `name` property → throw

### Wire Plan

| File | Action | Purpose |
|------|--------|---------|
| `.docu/node/plugin.ts` | Create | Interface + types |
| `.docu/node/plugin-loader.ts` | Create | Config → plugin instances |
| `.docu/node/plugin-runner.ts` | Create | Hook execution engine |
| `.docu/node/types.ts` | Modify | Add `plugins` field to `DocuConfig` |
| `.docu/node/build.ts` | Modify | Wire hooks into build pipeline |
| `.docu/node/server.ts` | Modify | Wire `handleRequest` hook |
| `.docu/node/html.ts` | Modify | Add `headExtra`/`bodyExtra` to `HtmlShellOptions` |
| `.docu/node/mdx.ts` | Modify | Merge plugin remark/rehype into pipeline |
| `docu.schema.json` | Modify | Add `plugins` schema |
| `.docu/__tests__/plugin.test.ts` | Create | Unit tests for loader + runner |

## Rationale

- **Zero-config default** — no plugins, no behavior change (backward compatible)
- **Composable** — plugins stack sequentially without conflict
- **Type-safe** — full TypeScript with `satisfies DocuBookPlugin` support
- **Bun-native** — `import()` works directly; no webpack/vite compat needed
- **Minimal surface** — 9 hooks only where extension is genuinely needed

## Consequences

- Plugin loading adds a synchronous startup cost (negligible — `import()` is fast for small plugins)
- Plugin hook execution adds per-page overhead (one extra loop iteration per hook, <1ms)
- Plugin errors are fatal during build (acceptable — plugins are trusted code)
- Plugin system is optional — projects that don't use it pay zero cost at import time (lazy `require`)
- Future phases: extract built-in search as `@docubook/plugin-search`, add `transformRawContent` hook for reading-time

## References

- Design doc: `packages/flame/PLUGIN_DESIGN.md` (400 lines, 5 open questions, 3 example plugins)
- Example plugins: sitemap, analytics, reading-time
- Open questions answered in design doc: Q1→A (pass raw content), Q2→B (no cache access), Q3→B (no enforce), Q4→B (first-wins), Q5→B (runtime only)
