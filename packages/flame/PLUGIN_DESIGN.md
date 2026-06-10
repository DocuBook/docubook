# DocuBook Plugin System — Design Document

> **Design alignment:** This plugin system follows Bun's universal plugin API conventions —`setup(build)` pattern, lifecycle hooks (`onStart`, `onEnd`, `onLoad`), `filter`/`namespace` matching, and `build.config` access. Domain-specific hooks (`transformFrontmatter`, `injectHead`, etc.) are registered via the same `PluginBuilder` pattern.

## 1. Design Goals

|          Goal           |                     Rationale                     |
| ----------------------- | ------------------------------------------------- |
| **Zero-config default** | Without plugins, behavior is identical to current |
| **Composable**          | Plugins can stack without conflict                |
| **Type-safe**           | Full TypeScript interface, IDE autocomplete       |
| **Bun-native**          | Adopts `setup(build)` pattern from Bun API        |
| **Minimal surface**     | Hooks only at genuinely needed points             |

## 2. Plugin Interface

```ts
// packages/flame/.docu/node/plugin.ts

import type { Pluggable } from "unified";
import type { BuildConfig } from "bun";

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

/**
 * PluginBuilder — analogous to Bun's PluginBuilder.
 * Plugins register hooks through these methods inside `setup()`.
 */
export interface PluginBuilder {
  /** Build config (set by framework before setup is called). */
  config: DocuConfig;

  // ─── Build Lifecycle ───────────────────────────────────
  /** Called once before build starts. Setup resources, validate config. */
  onStart(callback: (config: DocuConfig) => void | Promise<void>): void;

  /** Called once after all pages are built. Generate sitemaps, manifests, etc. */
  onEnd(callback: (config: DocuConfig, pages: PageMeta[]) => void | Promise<void>): void;

  // ─── Content Transform ─────────────────────────────────
  /**
   * Transform file contents before MDX compilation.
   * Similar to Bun's `onLoad` — filter by file pattern.
   */
  onLoad(
    args: { filter: RegExp; namespace?: string },
    callback: (args: { path: string; content: string }) => {
      contents?: string;
      loader?: "js" | "ts" | "mdx";
    } | void,
  ): void;

  /** Mutate frontmatter before MDX compilation. */
  transformFrontmatter(
    callback: (
      frontmatter: Record<string, unknown>,
      context: Pick<PageContext, "slug" | "filePath" | "content">,
    ) => Record<string, unknown> | void,
  ): void;

  /** Transform final HTML string per page. Last chance to inject/modify. */
  transformHtml(
    callback: (html: string, context: PageContext) => string | Promise<string>,
  ): void;

  // ─── Head & Script Injection ───────────────────────────
  /** Return HTML strings to inject inside <head>. */
  injectHead(callback: (context: PageContext) => string | string[]): void;

  /** Return HTML strings to inject before </body>. */
  injectBody(callback: (context: PageContext) => string | string[]): void;

  // ─── MDX Pipeline Extension ────────────────────────────
  /** Additional remark plugins to append to the pipeline. */
  remarkPlugins(callback: () => Pluggable[]): void;

  /** Additional rehype plugins to append to the pipeline. */
  rehypePlugins(callback: () => Pluggable[]): void;

  // ─── Dev Server ────────────────────────────────────────
  /** Hook into dev server request handling. Return Response to short-circuit. */
  handleRequest(
    callback: (
      req: Request,
      context: DevServerContext,
    ) => Response | void | Promise<Response | void>,
  ): void;
}

/**
 * DocuBookPlugin — follows BunPlugin conventions:
 * - `name`: unique identifier
 * - `setup(build)`: where hooks are registered via PluginBuilder
 */
export interface DocuBookPlugin {
  name: string;
  setup(build: PluginBuilder): void | Promise<void>;
}
```

### Key Design Decisions

| Bun Plugin API                    | DocuBook Plugin API                   | Notes                                    |
| --------------------------------- | ------------------------------------- | ---------------------------------------- |
| `name + setup(build)`             | `name + setup(build)`                 | Identical convention                    |
| `build.onStart(fn)`               | `build.onStart(fn)`                   | Identical                                |
| `build.onEnd(fn)`                 | `build.onEnd(fn)`                     | Identical                                |
| `build.onLoad({filter}, cb)`      | `build.onLoad({filter}, cb)`          | Same pattern, different context (file vs import) |
| `build.onResolve({filter}, cb)`   | *(none — irrelevant for SSG)*          | DocuBook does not resolve module imports |
| `build.config`                    | `build.config`                        | Identical                                |
| *(none)*                          | `build.transformFrontmatter(cb)`      | Domain-specific: frontmatter             |
| *(none)*                          | `build.transformHtml(cb)`             | Domain-specific: HTML final              |
| *(none)*                          | `build.injectHead(cb)`                | Domain-specific: head injection          |
| *(none)*                          | `build.injectBody(cb)`                | Domain-specific: body injection          |
| *(none)*                          | `build.remarkPlugins(cb)`             | Domain-specific: MDX pipeline            |
| *(none)*                          | `build.rehypePlugins(cb)`             | Domain-specific: MDX pipeline            |
| *(none)*                          | `build.handleRequest(cb)`             | Domain-specific: dev server              |

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
// Factory pattern (with options) — return a DocuBookPlugin
export default function pluginSitemap(options?: SitemapOptions): DocuBookPlugin {
  return {
    name: "sitemap",
    setup(build) {
      build.onEnd((config, pages) => {
        /* generate sitemap.xml */
      });
    },
  };
}

// Simple pattern (no options)
export default {
  name: "my-plugin",
  setup(build) {
    build.onStart(() => console.log("build started"));
  },
} satisfies DocuBookPlugin;
```

## 4. Integration Points (Build Pipeline)

```
build()
│
├─ [1] loadPlugins(config.plugins)         → DocuBookPlugin[]
│
├─ [2] create PluginBuilder(config)
├─ [3] for each plugin: plugin.setup(build) ← SETUP PHASE (registers all hooks)
│
├─ [4] build.onStart(config)               ← all registered onStart callbacks
│
├─ findMdxFiles()
├─ buildClientBundle()
│
├─ for each MDX file:
│   ├─ [5] build.onLoad({filter})          ← transform raw file content
│   ├─ [6] build.transformFrontmatter()    ← mutate frontmatter
│   ├─ compileMdx() with merged remark/rehype plugins
│         ← [7] build.remarkPlugins() / build.rehypePlugins()
│   ├─ renderToString()
│   ├─ htmlShell() with injected head/body
│         ← [8] build.injectHead() / build.injectBody()
│   └─ [9] build.transformHtml()           ← final HTML transform
│
├─ generateSearchIndex()
├─ [10] build.onEnd(config, pages)         ← all registered onEnd callbacks
└─ writeCache()
```

## 5. Integration Points (Dev Server)

```
server.fetch(req)
│
├─ [1] build.handleRequest(req)            ← early return short-circuits
├─ HMR / static / router (existing logic)
├─ renderDocsPage() → same hooks [5-9] as build
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

## 7. PluginBuilder Implementation

```ts
// packages/flame/.docu/node/plugin-builder.ts

type Awaitable<T> = T | Promise<T>;

export class BuildPluginBuilder implements PluginBuilder {
  config: DocuConfig;

  private _onStart: Array<(config: DocuConfig) => Awaitable<void>> = [];
  private _onEnd: Array<(config: DocuConfig, pages: PageMeta[]) => Awaitable<void>> = [];
  private _onLoad: Array<{
    filter: RegExp;
    namespace?: string;
    fn: (args: { path: string; content: string }) => Awaitable<{ contents?: string; loader?: string } | void>;
  }> = [];
  private _transformFrontmatter: Array<(...) => ...> = [];
  private _transformHtml: Array<(html: string, ctx: PageContext) => Awaitable<string>> = [];
  private _injectHead: Array<(ctx: PageContext) => string | string[]> = [];
  private _injectBody: Array<(ctx: PageContext) => string | string[]> = [];
  private _remarkPlugins: Array<() => Pluggable[]> = [];
  private _rehypePlugins: Array<() => Pluggable[]> = [];
  private _handleRequest: Array<(req: Request, ctx: DevServerContext) => Awaitable<Response | void>> = [];

  constructor(config: DocuConfig) {
    this.config = config;
  }

  // ─── Registration ──────────────────────────────────────
  onStart(cb: (config: DocuConfig) => Awaitable<void>) { this._onStart.push(cb); }
  onEnd(cb: (config: DocuConfig, pages: PageMeta[]) => Awaitable<void>) { this._onEnd.push(cb); }
  onLoad(args: { filter: RegExp; namespace?: string }, cb: ...) { this._onLoad.push({ ...args, fn: cb }); }
  transformFrontmatter(cb: ...) { this._transformFrontmatter.push(cb); }
  transformHtml(cb: ...) { this._transformHtml.push(cb); }
  injectHead(cb: ...) { this._injectHead.push(cb); }
  injectBody(cb: ...) { this._injectBody.push(cb); }
  remarkPlugins(cb: ...) { this._remarkPlugins.push(cb); }
  rehypePlugins(cb: ...) { this._rehypePlugins.push(cb); }
  handleRequest(cb: ...) { this._handleRequest.push(cb); }

  // ─── Execution ─────────────────────────────────────────
  async runOnStart() {
    for (const cb of this._onStart) await cb(this.config);
  }

  async runOnEnd(pages: PageMeta[]) {
    for (const cb of this._onEnd) await cb(this.config, pages);
  }

  async runOnLoad(path: string, content: string): Promise<{ contents?: string } | null> {
    for (const h of this._onLoad) {
      if (h.filter.test(path)) {
        const result = await h.fn({ path, content });
        if (result) return result;
      }
    }
    return null;
  }

  transformFrontmatterChain(fm: ..., ctx: ...) { ... }
  async transformHtmlChain(html: string, ctx: PageContext) { ... }
  collectHead(ctx: PageContext): string[] { ... }
  collectBody(ctx: PageContext): string[] { ... }
  collectRemarkPlugins(): Pluggable[] { ... }
  collectRehypePlugins(): Pluggable[] { ... }
  async runHandleRequest(req: Request, ctx: DevServerContext): Promise<Response | null> { ... }
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

Current `htmlShell` only accepts fixed options. Needs extension for injection:

```ts
export interface HtmlShellOptions {
  // ... existing
  headExtra?: string[];   // ← from injectHead callbacks
  bodyExtra?: string[];   // ← from injectBody callbacks
}
```

Injection placement:
- `headExtra` → before `</head>`
- `bodyExtra` → before `</body>`, after the main script

## 10. Execution Order & Conflict Resolution

|        Concern        |                        Strategy                         |
| --------------------- | ------------------------------------------------------- |
| **Plugin order**      | Array order in `docu.json` = `setup()` execution order  |
| **Hook chaining**     | Sequential (waterfall) for transform hooks              |
| **Hook parallel**     | None — all sequential for predictability                |
| **Error handling**    | Plugin error = build error (fail fast, log plugin name) |
| **Duplicate plugins** | Allowed (user responsibility)                           |

## 11. Example Plugins

### `@docubook/plugin-sitemap`
```ts
import type { DocuBookPlugin } from "@docubook/flame";

export default function pluginSitemap(opts?: { hostname?: string }): DocuBookPlugin {
  return {
    name: "sitemap",
    setup(build) {
      build.onEnd((config, pages) => {
        const host = opts?.hostname || config.meta.baseURL;
        const urls = pages.map((p) => `<url><loc>${host}/docs/${p.slug}</loc></url>`);
        const xml = `<?xml version="1.0"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        await Bun.write(join(DIST_DIR, "sitemap.xml"), xml);
      });
    },
  };
}
```

### `@docubook/plugin-analytics`
```ts
export default function pluginAnalytics(opts: { id: string }): DocuBookPlugin {
  return {
    name: "analytics",
    setup(build) {
      build.injectHead(() => {
        return `<script async src="https://www.googletagmanager.com/gtag/js?id=${opts.id}"></script>`;
      });
      build.injectBody(() => {
        return `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${opts.id}');</script>`;
      });
    },
  };
}
```

### `@docubook/plugin-reading-time`
```ts
export default {
  name: "reading-time",
  setup(build) {
    build.transformFrontmatter((fm, ctx) => {
      const wordCount = ctx.content.split(/\s+/).length;
      const minutes = Math.max(1, Math.ceil(wordCount / 200));
      return { ...fm, readingTime: `${minutes} min read` };
    });
  },
} satisfies DocuBookPlugin;
```

## 12. Lifecycle Hook Summary

|       Hook        |              Trigger              |       Callback Signature        |                     Use Case                      |
| ----------------- | --------------------------------- | ------------------------------- | ------------------------------------------------- |
| `onStart`         | Before build begins               | `(config) => void`              | Validate config, initialize resources             |
| `onLoad`          | Before file is read/compiled      | `({path, content}) => contents` | Transform raw MDX/MD before compilation           |
| `transformFrontmatter` | After frontmatter parsed     | `(fm, ctx) => fm`               | Inject reading time, validate fields              |
| `remarkPlugins`   | MDX compilation pipeline          | `() => Pluggable[]`             | Custom remark transforms                          |
| `rehypePlugins`   | MDX compilation pipeline          | `() => Pluggable[]`             | Custom rehype transforms                          |
| `injectHead`      | HTML shell generation             | `(ctx) => string`               | Analytics, meta tags, stylesheets                 |
| `injectBody`      | HTML shell generation             | `(ctx) => string`               | Scripts, widgets                                  |
| `transformHtml`   | Final HTML output                 | `(html, ctx) => html`           | Post-processing, minification, link rewriting     |
| `handleRequest`   | Dev server request handler        | `(req, ctx) => Response`        | Custom API routes, mock data, redirects           |
| `onEnd`           | After all pages built             | `(config, pages) => void`       | Sitemap, search index, RSS, manifests             |

## 13. Open Questions

|  #  |                            Question                             |                                Options                                 |                                                    |
| --- | --------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | Should `transformFrontmatter` receive raw MDX content?          | **A) Yes** (enables reading-time). B) No (keep it pure metadata)       |                                                    |
| 2   | Should plugins access the build cache?                          | **B) No** — plugins stateless (manage own state via files)             |                                                    |
| 3   | Plugin ordering: explicit `enforce: 'pre'                       | 'post'`?                                                               | **B) No** — KISS, array order only (like Bun)     |
| 4   | Should `handleRequest` support middleware chaining (next())?    | **B) No** — first-response-wins (return `void` to pass to the next plugin) |                              |
| 5   | Config validation: should plugins declare their options schema? | **B) No** — runtime validation only (plugin author's responsibility)   |                                                    |

## 14. Files to Create/Modify

|               File               | Action |            Purpose            |
| -------------------------------- | ------ | ----------------------------- |
| `.docu/node/plugin.ts`           | Create | Plugin interface + types      |
| `.docu/node/plugin-loader.ts`    | Create | Config → plugin instances     |
| `.docu/node/plugin-builder.ts`   | Create | PluginBuilder implementation  |
| `.docu/node/types.ts`            | Modify | Add `plugins` to `DocuConfig` |
| `.docu/node/build.ts`            | Modify | Wire hooks into build         |
| `.docu/node/server.ts`           | Modify | Wire `handleRequest` hook     |
| `.docu/node/html.ts`             | Modify | Add `headExtra`/`bodyExtra`   |
| `.docu/node/mdx.ts`              | Modify | Merge plugin remark/rehype    |
| `docu.schema.json`               | Modify | Add `plugins` schema          |
| `.docu/__tests__/plugin.test.ts` | Create | Unit tests                    |
