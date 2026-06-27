# ADR-009: Plugin System Architecture

## Status

**Implemented (2026-06-18)** — see [`plugin.ts`](../../packages/flame/.docu/node/plugin.ts), [`plugin-builder.ts`](../../packages/flame/.docu/node/plugin-builder.ts), [`plugin-loader.ts`](../../packages/flame/.docu/node/plugin-loader.ts).

## Context

`@docubook/flame` is a Bun SSG framework used for production documentation sites. Users increasingly need to extend flame without forking the framework — generating sitemaps, injecting analytics, supporting Algolia search indexing, adding reading-time estimates, or transforming HTML per-page.

Without a plugin system, users either:
1. Fork flame and maintain custom patches (high maintenance burden)
2. Implement their extensions as post-build shell scripts (fragile, no access to page metadata)
3. Send feature requests for every extension (blocks innovation)

The plugin system must balance extensibility with minimal surface area — most sites don't need plugins.

## Decision

Implement a **hook-based plugin system** with a `BuildPluginBuilder` class that integrates at **10 points** in the build pipeline and dev server. Uses the `PluginBuilder` pattern (mimicking Bun's `BunPlugin` convention):

### Plugin Interface

```typescript
interface DocuBookPlugin {
  name: string;
  setup(build: PluginBuilder): void | Promise<void>;
}
```

Plugins don't implement hooks directly. Instead, `setup()` receives a `PluginBuilder` and registers callbacks through typed methods:

```typescript
interface PluginBuilder {
  config: DocuConfig;
  onStart(fn): void;             // pre-build
  onEnd(fn): void;               // post-build
  onLoad({filter, namespace?}, fn): void;  // file transform before MDX
  transformFrontmatter(fn): void;           // frontmatter waterfall
  transformHtml(fn): void;                  // HTML pipeline
  injectHead(fn): void;                     // <head> injection
  injectBody(fn): void;                     // </body> injection
  remarkPlugins(fn): void;
  rehypePlugins(fn): void;
  handleRequest(fn): void;                  // dev server route intercept
}
```

### Key Design Choices

| Concern | Decision | Rationale |
|---------|----------|-----------|
| **Execution order** | Sequential (waterfall) — registration order | Predictability; plugin count is expected <5 |
| **Error handling** | Mixed: lifecycle hooks (`onStart`/`onEnd`/`onLoad`/`handleRequest`/`transform*`) catch-and-continue; collection hooks (`injectHead`/`injectBody`/`remarkPlugins`/`rehypePlugins`) throw with `cause` wrapping | Lifecycle hooks fail gracefully so one broken plugin doesn't block the build; collection hooks throw because malformed inject/plugin arrays would produce broken output |
| **Duplicate plugins** | Allowed (user responsibility) | Simpler than dedup logic |
| **Plugin resolution** | `import()` — npm package, relative path (traversal-guarded), or absolute path | Bun-native, path traversal prevented |
| **Options passing** | Factory pattern: `export default function(options?)` or object pattern: `export default { name, setup }` | Both supported for flexibility |
| **`handleRequest` chaining** | First-response-wins (not middleware `next()`) | Simple mental model; responses wrapped with missing security headers |
| **`injectHead`/`injectBody` dedup** | `[...new Set(items)]` — deduplicates identical injected strings | Prevents duplicate analytics snippets from multiple plugins |
| **`injectHead`/`injectBody` type guard** | `collectItems()` warns on non-string items; `collectBody()`/`collectHead()` wrap errors | XSS defense — plugin authors warned about invalid return types |
| **Build cache access** | Not exposed — plugins are stateless | Avoids coupling to internal cache format |
| **Config schema** | Runtime validation only — no JSON Schema per plugin | Over-engineered for v1; plugins validate their own options |
| **`onLoad` hook** | First matching `filter` regex wins | Enables preprocessing specific files before MDX compilation |

### Integration Points

```
Build Pipeline                           Dev Server (server.ts)
├─ [1] loadPlugins(config.plugins)       ├─ [1] loadPlugins(config.plugins)
├─ [2] builder.runOnStart(config)        ├─ [2] builder.runHandleRequest(req)
├─ buildClientBundle()                   │   └─ wrap response with SECURITY_HEADERS + CSP
├─ for each MDX (CONCURRENCY=4):         ├─ HMR / static / router (server-routes.ts)
│  ├─ [3] builder.runOnLoad()            ├─ getDocsForSlug() → renderDocsServerPage()
│  ├─ [4] runTransformFrontmatterChain() │   └─ [3-10] same hooks as build
│  ├─ [5] builder.remarkPlugins()        └─ response with nonce per page
│  ├─ [6] builder.rehypePlugins()
│  ├─ [7] builder.collectHead() + dedup
│  ├─ [8] builder.collectBody() + dedup
│  ├─ [9] builder.transformHtml()
│  └─ writeFile with unique nonce
├─ [10] builder.runOnEnd(config, pages)
├─ generateSearchIndex()
└─ writeCache()
```

### Resolution Rules

```jsonc
// docu.json
{ "plugins": [
    "@docubook/plugin-sitemap",                    // string → object pattern
    ["@docubook/plugin-analytics", { "id": "G-XXX" }],  // factory with options
    "./plugins/my-plugin"                           // relative path (resolved from project root)
] }
```

1. **`string`** → `import(specifier).default` — duck-typed as `DocuBookPlugin`
2. **`[string, object]`** → `import(specifier).default(options)` — factory pattern
3. **Relative path (`./`)** → resolve from `PROJECT_ROOT`, guarded against traversal outside project
4. **Absolute path (`/`)** → also guarded against traversal outside project
5. **npm package** → passed directly to Bun's `import()`
6. Missing `name` (not a string) → throw
7. Missing `setup` (not a function) → throw

### Implemented Files

| File | Purpose |
|------|---------|
| `.docu/node/plugin.ts` | `DocuBookPlugin` + `PluginBuilder` interfaces, types (`PluginEntry`, `PageContext`, `PageMeta`, `DevServerContext`) |
| `.docu/node/plugin-loader.ts` | `loadPlugins()` with path traversal guard (`resolveSpecifier()`), factory/object pattern support |
| `.docu/node/plugin-builder.ts` | `BuildPluginBuilder` class — 10 hook arrays, `run*()` executors, `collect*()` with dedup, error wrapping |
| `.docu/node/build.ts` | Wired into build pipeline: plugin loading, `onStart`, `onLoad`, `transformFm`, `remark/rehype`, `injectHead/Body`, `transformHtml`, `onEnd` |
| `.docu/node/server.ts` | Wired into dev server: `handleRequest` with security header wrapping |
| `.docu/node/server-routes.ts` | Plugin hooks active in `getDocsForSlug()` and `renderDocsServerPage()` |
| `.docu/node/html.ts` | `htmlShell()` accepts `headExtra`/`bodyExtra` arrays |
| `.docu/__tests__/plugin.test.ts` | Unit tests: lifecycle, error wrapping, dedup, type guard, sanitization warnings |
| `.docu/__tests__/plugin-integration.test.ts` | Integration tests: loading, factory, invalid plugins, fixtures (simple-plugin, missing-name, missing-setup, invalid-string) |

## Rationale

- **Zero-config default** — no plugins, no behavior change (backward compatible)
- **PluginBuilder pattern** — mirrors Bun's plugin convention, familiar to Bun users; methods are typed, offering IDE autocompletion
- **Composable** — plugins stack sequentially without conflict
- **Type-safe** — full TypeScript with generic `PluginBuilder` methods
- **Bun-native** — `import()` works directly; no webpack/vite compat needed
- **Minimal surface** — 10 hooks only where extension is genuinely needed
- **Security-first** — path traversal guard in loader, type guard + sanitization warnings in injectors, security headers automatically added to `handleRequest` responses

## Consequences

- Plugin loading adds a synchronous startup cost (negligible — `import()` is fast for small plugins)
- Plugin hook execution adds per-page overhead (sequential loop over <5 plugins × 10 hooks = <1ms per page)
- Plugin error behavior is mixed: lifecycle hooks (`onStart`, `onEnd`, `onLoad`, `handleRequest`, `transformFrontmatter`, `transformHtml`) catch errors per-callback, log with plugin name, and continue; collection hooks (`injectHead`, `injectBody`, `remarkPlugins`, `rehypePlugins`) throw with `cause` wrapping because malformed output would reach production
- Plugin system is optional — projects that don't use it pay zero cost (`BuildPluginBuilder` only instantiated when `config.plugins` is non-empty)
- Security headers automatically applied to `handleRequest` responses (missing HSTS/XFO/XCTO/RP/PP added; HTML gets CSP nonce)
- Future phases: extract built-in search as `@docubook/plugin-search`, add `transformRawContent` hook for reading-time

## References

- Implementation: [`plugin.ts`](../../packages/flame/.docu/node/plugin.ts), [`plugin-builder.ts`](../../packages/flame/.docu/node/plugin-builder.ts), [`plugin-loader.ts`](../../packages/flame/.docu/node/plugin-loader.ts)
- Tests: [`plugin.test.ts`](../../packages/flame/.docu/__tests__/plugin.test.ts), [`plugin-integration.test.ts`](../../packages/flame/.docu/__tests__/plugin-integration.test.ts)
