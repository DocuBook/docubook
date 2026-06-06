# DocuBook Plugin System — Design Document

## 1. Design Goals

|          Goal           |                    Rationale                     |
| ----------------------- | ------------------------------------------------ |
| **Zero-config default** | Tanpa plugin, behavior identik dengan sekarang   |
| **Composable**          | Plugin bisa stack tanpa conflict                 |
| **Type-safe**           | Full TypeScript interface, autocomplete di IDE   |
| **Bun-native**          | Tidak perlu bundler compat layer (webpack/vite)  |
| **Minimal surface**     | Hooks hanya di titik yang benar-benar dibutuhkan |

## 2. Plugin Interface

```ts
// packages/flame/.docu/node/plugin.ts

import type { Pluggable } from "unified";

export interface PageContext {
  /** Relative path: "getting-started/introduction" */
  slug: string;
  /** Absolute file path */
  filePath: string;
  /** Parsed frontmatter */
  frontmatter: Record<string, unknown>;
  /** Site config */
  config: DocuConfig;
}

export interface PageMeta {
  slug: string;
  title: string;
  filePath: string;
  outputPath: string;
}

export interface DevServerContext {
  port: number;
  hostname: string;
}

export interface DocuBookPlugin {
  name: string;

  // ─── Build Lifecycle ───────────────────────────────────
  /** Called once before build starts. Setup resources, validate config. */
  buildStart?(config: DocuConfig): void | Promise<void>;

  /** Called once after all pages are built. Generate sitemaps, manifests, etc. */
  buildEnd?(config: DocuConfig, pages: PageMeta[]): void | Promise<void>;

  // ─── Content Transform ─────────────────────────────────
  /** Mutate frontmatter before MDX compilation. */
  transformFrontmatter?(
    frontmatter: Record<string, unknown>,
    context: Pick<PageContext, "slug" | "filePath">
  ): Record<string, unknown> | void;

  /** Transform final HTML string per page. Last chance to inject/modify. */
  transformHtml?(html: string, context: PageContext): string | Promise<string>;

  // ─── Head & Script Injection ───────────────────────────
  /** Return HTML strings to inject inside <head>. */
  injectHead?(context: PageContext): string | string[];

  /** Return HTML strings to inject before </body>. */
  injectBody?(context: PageContext): string | string[];

  // ─── MDX Pipeline Extension ────────────────────────────
  /** Additional remark plugins to append to the pipeline. */
  remarkPlugins?(): Pluggable[];

  /** Additional rehype plugins to append to the pipeline. */
  rehypePlugins?(): Pluggable[];

  // ─── Dev Server ────────────────────────────────────────
  /** Hook into dev server request handling. Return Response to short-circuit. */
  handleRequest?(req: Request, context: DevServerContext): Response | void | Promise<Response | void>;
}
```

## 3. Config Extension

```jsonc
// docu.json
{
  "meta": { ... },
  "plugins": [
    "@docubook/plugin-sitemap",
    "@docubook/plugin-analytics",
    ["@docubook/plugin-search-algolia", { "appId": "xxx", "apiKey": "yyy" }]
  ]
}
```

**Resolution rules:**
1. `string` → `require(name).default` (no options)
2. `[string, object]` → `require(name).default(options)` (factory pattern)
3. Relative path `"./plugins/my-plugin"` → resolve from project root

**Plugin export convention:**
```ts
// Factory pattern (with options)
export default function pluginSitemap(options?: SitemapOptions): DocuBookPlugin {
  return {
    name: "sitemap",
    buildEnd(config, pages) { /* generate sitemap.xml */ },
  };
}

// Simple pattern (no options)
export default { name: "my-plugin", buildStart() { } } satisfies DocuBookPlugin;
```

## 4. Integration Points (Build Pipeline)

```
build()
│
├─ [1] loadPlugins(config.plugins)
├─ [2] plugin.buildStart(config)          ← NEW
│
├─ findMdxFiles()
├─ buildClientBundle()
│
├─ for each MDX file:
│   ├─ [3] plugin.transformFrontmatter()  ← NEW
│   ├─ compileMdx() with merged remark/rehype plugins  ← [4] plugin.remarkPlugins() / rehypePlugins()
│   ├─ renderToString()
│   ├─ htmlShell() with injected head/body  ← [5] plugin.injectHead() / injectBody()
│   └─ [6] plugin.transformHtml()         ← NEW
│
├─ generateSearchIndex()
├─ [7] plugin.buildEnd(config, pages)     ← NEW
└─ writeCache()
```

## 5. Integration Points (Dev Server)

```
server.fetch(req)
│
├─ [1] plugin.handleRequest(req)  ← NEW (early return short-circuits)
├─ HMR / static / router (existing logic)
├─ renderDocsPage() → same hooks [3-6] as build
└─ response
```

## 6. Plugin Loader

```ts
// packages/flame/.docu/node/plugin-loader.ts

type PluginEntry = string | [string, Record<string, unknown>];

export async function loadPlugins(entries: PluginEntry[] = []): Promise<DocuBookPlugin[]> {
  const plugins: DocuBookPlugin[] = [];

  for (const entry of entries) {
    const [specifier, options] = Array.isArray(entry) ? entry : [entry, undefined];
    const resolved = specifier.startsWith(".")
      ? resolve(PROJECT_ROOT, specifier)
      : specifier;

    const mod = await import(resolved);
    const exported = mod.default;

    const plugin: DocuBookPlugin =
      typeof exported === "function" ? exported(options) : exported;

    if (!plugin.name) {
      throw new Error(`Plugin "${specifier}" must have a 'name' property`);
    }

    plugins.push(plugin);
  }

  return plugins;
}
```

## 7. Hook Runner

```ts
// packages/flame/.docu/node/plugin-runner.ts

export class PluginRunner {
  constructor(private plugins: DocuBookPlugin[]) {}

  async buildStart(config: DocuConfig) {
    for (const p of this.plugins) await p.buildStart?.(config);
  }

  async buildEnd(config: DocuConfig, pages: PageMeta[]) {
    for (const p of this.plugins) await p.buildEnd?.(config, pages);
  }

  transformFrontmatter(fm: Record<string, unknown>, ctx: Pick<PageContext, "slug" | "filePath">) {
    let result = fm;
    for (const p of this.plugins) {
      result = p.transformFrontmatter?.(result, ctx) ?? result;
    }
    return result;
  }

  async transformHtml(html: string, ctx: PageContext) {
    let result = html;
    for (const p of this.plugins) {
      result = (await p.transformHtml?.(result, ctx)) ?? result;
    }
    return result;
  }

  collectHead(ctx: PageContext): string[] {
    return this.plugins.flatMap((p) => {
      const r = p.injectHead?.(ctx);
      return r ? (Array.isArray(r) ? r : [r]) : [];
    });
  }

  collectBody(ctx: PageContext): string[] {
    return this.plugins.flatMap((p) => {
      const r = p.injectBody?.(ctx);
      return r ? (Array.isArray(r) ? r : [r]) : [];
    });
  }

  collectRemarkPlugins(): Pluggable[] {
    return this.plugins.flatMap((p) => p.remarkPlugins?.() ?? []);
  }

  collectRehypePlugins(): Pluggable[] {
    return this.plugins.flatMap((p) => p.rehypePlugins?.() ?? []);
  }

  async handleRequest(req: Request, ctx: DevServerContext): Promise<Response | null> {
    for (const p of this.plugins) {
      const res = await p.handleRequest?.(req, ctx);
      if (res) return res;
    }
    return null;
  }
}
```

## 8. Schema Update (`docu.schema.json`)

```jsonc
{
  "plugins": {
    "type": "array",
    "description": "List of DocuBook plugins to load",
    "items": {
      "oneOf": [
        { "type": "string", "description": "Plugin package name or relative path" },
        {
          "type": "array",
          "items": [
            { "type": "string", "description": "Plugin package name" },
            { "type": "object", "description": "Plugin options" }
          ],
          "minItems": 2,
          "maxItems": 2
        }
      ]
    }
  }
}
```

## 9. `htmlShell` Modification

Current `htmlShell` hanya terima fixed options. Perlu extend untuk injection:

```ts
export interface HtmlShellOptions {
  // ... existing
  headExtra?: string[];   // ← plugin.injectHead() results
  bodyExtra?: string[];   // ← plugin.injectBody() results
}
```

Injection placement:
- `headExtra` → sebelum `</head>`
- `bodyExtra` → sebelum `</body>`, setelah main script

## 10. Execution Order & Conflict Resolution

|        Concern        |                        Strategy                         |
| --------------------- | ------------------------------------------------------- |
| **Plugin order**      | Array order di `docu.json` = execution order            |
| **Hook chaining**     | Sequential (waterfall) untuk transform hooks            |
| **Hook parallel**     | Tidak ada — semua sequential untuk predictability       |
| **Error handling**    | Plugin error = build error (fail fast, log plugin name) |
| **Duplicate plugins** | Allowed (user responsibility)                           |

## 11. Example Plugins

### `@docubook/plugin-sitemap`
```ts
export default function pluginSitemap(opts?: { hostname?: string }): DocuBookPlugin {
  return {
    name: "sitemap",
    async buildEnd(config, pages) {
      const host = opts?.hostname || config.meta.baseURL;
      const urls = pages.map((p) => `<url><loc>${host}/docs/${p.slug}</loc></url>`);
      const xml = `<?xml version="1.0"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
      await Bun.write(join(DIST_DIR, "sitemap.xml"), xml);
    },
  };
}
```

### `@docubook/plugin-analytics`
```ts
export default function pluginAnalytics(opts: { id: string }): DocuBookPlugin {
  return {
    name: "analytics",
    injectHead() {
      return `<script async src="https://www.googletagmanager.com/gtag/js?id=${opts.id}"></script>`;
    },
    injectBody() {
      return `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${opts.id}');</script>`;
    },
  };
}
```

### `@docubook/plugin-reading-time`
```ts
export default { 
  name: "reading-time",
  transformFrontmatter(fm, ctx) {
    // Inject reading time into frontmatter
    // (would need raw content access — see Open Questions)
    return { ...fm, readingTime: "3 min read" };
  },
} satisfies DocuBookPlugin;
```

## 12. Migration Path

|    Phase    |                              Scope                               |  Breaking?  |
| ----------- | ---------------------------------------------------------------- | ----------- |
| **Phase 1** | Add `plugins` field to config + loader + runner (no-op if empty) | ❌           |
| **Phase 2** | Wire hooks into build pipeline                                   | ❌           |
| **Phase 3** | Wire hooks into dev server                                       | ❌           |
| **Phase 4** | Extract built-in search as `@docubook/plugin-search`             | ⚠️ Optional |

## 13. Open Questions

|  #  |                            Question                             |                                Options                                 |                                                    |
| --- | --------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | Should `transformFrontmatter` receive raw MDX content?          | A) Yes (enables reading-time). B) No (keep it pure metadata transform) |                                                    |
| 2   | Should plugins access the build cache?                          | A) Yes (for incremental plugin builds). B) No (plugins are stateless)  |                                                    |
| 3   | Plugin ordering: explicit `enforce: 'pre'                       | 'post'`?                                                               | A) Yes (like Vite). B) No (KISS, array order only) |
| 4   | Should `handleRequest` support middleware chaining (next())?    | A) Yes (Express-style). B) No (first-response-wins)                    |                                                    |
| 5   | Config validation: should plugins declare their options schema? | A) Yes (JSON Schema). B) No (runtime validation only)                  |                                                    |

---

## 14. Files to Create/Modify

|               File               | Action |            Purpose            |
| -------------------------------- | ------ | ----------------------------- |
| `.docu/node/plugin.ts`           | Create | Plugin interface + types      |
| `.docu/node/plugin-loader.ts`    | Create | Config → plugin instances     |
| `.docu/node/plugin-runner.ts`    | Create | Hook execution engine         |
| `.docu/node/types.ts`            | Modify | Add `plugins` to `DocuConfig` |
| `.docu/node/build.ts`            | Modify | Wire hooks into build         |
| `.docu/node/server.ts`           | Modify | Wire `handleRequest` hook     |
| `.docu/node/html.ts`             | Modify | Add `headExtra`/`bodyExtra`   |
| `.docu/node/mdx.ts`              | Modify | Merge plugin remark/rehype    |
| `docu.schema.json`               | Modify | Add `plugins` schema          |
| `.docu/__tests__/plugin.test.ts` | Create | Unit tests                    |

---

Oke, saya lihat referensi skill-nya. Untuk fase desain plugin system ini, skill yang paling relevan adalah `architecture-design` dan `brainstorm-feature`. Tapi sebelum lanjut ke implementasi nanti, kita perlu jawab dulu **5 open questions** di design doc supaya tidak salah langkah.

Berdasarkan arsitektur DocuBook yang sudah saya pelajari, ini rekomendasi saya:

## Open Questions — Rekomendasi

|  #  |                Question                |                       Rekomendasi                        |                                             Alasan                                             |                                                                                         |
| --- | -------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | `transformFrontmatter` terima raw MDX? | **A) Yes** — pass raw content sebagai parameter tambahan | Enables reading-time, word-count, custom excerpt. Tanpa ini plugin terlalu terbatas.           |                                                                                         |
| 2   | Plugin access build cache?             | **B) No** — plugins stateless                            | Plugin yang butuh state bisa manage sendiri (tulis file). Expose cache = coupling ke internal. |                                                                                         |
| 3   | `enforce: 'pre'                        | 'post'`?                                                 | **B) No** — array order only                                                                   | KISS. DocuBook bukan Vite — plugin count akan kecil (3-5 max). Explicit ordering cukup. |
| 4   | `handleRequest` middleware chaining?   | **B) First-response-wins**                               | Simpler mental model. Kalau plugin return Response, done. Kalau return void, next plugin.      |                                                                                         |
| 5   | Plugin options schema validation?      | **B) No** — runtime only                                 | Over-engineering untuk v1. Plugin author validate sendiri di factory function.                 |                                                                                         |

---

Mau kamu confirm/override keputusan di atas? Setelah itu saya bisa:

1. Finalize design doc dengan keputusan final
2. Store sebagai `decision` di memory
3. Lanjut ke implementasi Phase 1 (interface + loader + runner + tests) menggunakan skill `implement-feature`