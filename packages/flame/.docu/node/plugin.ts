import type { Pluggable } from "unified";
import type { DocuConfig } from "./types";

// ─── Config Types ───────────────────────────────────────

/**
 * Plugin entry in `docu.json` config.
 * - `string`: plugin package name or relative path (no options)
 * - `[string, object]`: plugin package name + factory options
 *
 * @example "@docubook/plugin-sitemap"
 * @example ["@docubook/plugin-search-algolia", { appId: "xxx" }]
 */
export type PluginEntry = string | [string, Record<string, unknown>];

// ─── Context Types ──────────────────────────────────────

/**
 * Context passed to content-transform hooks for a single page.
 */
export interface PageContext {
  /** Relative slug path: "getting-started/introduction" */
  slug: string;
  /** Absolute file path on disk */
  filePath: string;
  /** Parsed frontmatter metadata */
  frontmatter: Record<string, unknown>;
  /** Raw MDX/MD content (only available in `transformFrontmatter` when enabled) */
  content?: string;
  /** Resolved site configuration */
  config: DocuConfig;
}

/**
 * Metadata for a single built page, aggregated and passed to `onEnd`.
 */
export interface PageMeta {
  /** URL slug: "getting-started/introduction" */
  slug: string;
  /** Page title from frontmatter or filename */
  title: string;
  /** Absolute source file path */
  filePath: string;
  /** Relative output path under dist */
  outputPath: string;
}

/**
 * Context passed to the dev server request handler.
 */
export interface DevServerContext {
  /** Dev server port */
  port: number;
  /** Dev server hostname */
  hostname: string;
}

export type { DocuConfig };

// ─── PluginBuilder Interface ────────────────────────────

/**
 * Builder object passed to each plugin's `setup()` function.
 *
 * Follows Bun's `PluginBuilder` convention:
 * - Plugins register lifecycle callbacks through typed methods
 * - Callbacks are executed sequentially in registration order
 * - `config` provides read-only access to the resolved build config
 */
export interface PluginBuilder {
  /** Resolved DocuBook configuration (read-only after setup phase). */
  config: DocuConfig;

  // ─── Build Lifecycle ───────────────────────────────────

  /**
   * Register a callback to run once before the build starts.
   * Use for: validating config, initializing resources, fetching remote data.
   *
   * @param callback - Receives the resolved config. May return a Promise.
   *
   * @example
   * build.onStart((config) => {
   *   if (!config.meta.baseURL) throw new Error("baseURL required");
   * });
   */
  onStart(callback: (config: DocuConfig) => void | Promise<void>): void;

  /**
   * Register a callback to run once after all pages are built.
   * Use for: generating sitemaps, RSS feeds, manifests, post-build reports.
   *
   * @param callback - Receives config and aggregated page metadata. May return a Promise.
   *
   * @example
   * build.onEnd((config, pages) => {
   *   const xml = generateSitemap(pages, config.meta.baseURL);
   *   await Bun.write(join(DIST_DIR, "sitemap.xml"), xml);
   * });
   */
  onEnd(callback: (config: DocuConfig, pages: PageMeta[]) => void | Promise<void>): void;

  // ─── Content Transform ─────────────────────────────────

  /**
   * Register a callback to transform raw file content before MDX compilation.
   * Similar to Bun's `build.onLoad()` — filtered by file path pattern.
   *
   * Use for: preprocessing MDX/MD, injecting frontmatter, code transformations.
   *
   * @param args.filter - RegExp matched against the file's relative path
   * @param args.namespace - Optional namespace prefix (reserved for future use)
   * @param callback - Receives file path and raw content. Return new contents or void.
   *
   * @example
   * build.onLoad({ filter: /\.md$/ }, ({ path, content }) => {
   *   return { contents: `<!-- auto-processed -->\n${content}` };
   * });
   */
  onLoad(
    args: { filter: RegExp; namespace?: string },
    callback: (args: {
      path: string;
      content: string;
    }) => { contents?: string; loader?: "js" | "ts" | "mdx" } | void
  ): void;

  /**
   * Register a callback to mutate frontmatter before MDX compilation.
   * Callbacks are chained: the return value of one is passed as input to the next.
   *
   * Use for: injecting reading-time, validating fields, adding computed metadata.
   *
   * @param callback - Receives frontmatter object and page context. Return mutated frontmatter or void.
   *
   * @example
   * build.transformFrontmatter((fm, ctx) => {
   *   const wordCount = ctx.content!.split(/\s+/).length;
   *   return { ...fm, readingTime: `${Math.ceil(wordCount / 200)} min read` };
   * });
   */
  transformFrontmatter(
    callback: (
      frontmatter: Record<string, unknown>,
      context: Pick<PageContext, "slug" | "filePath" | "content">
    ) => Record<string, unknown> | void
  ): void;

  /**
   * Register a callback to transform the final HTML string per page.
   * This is the **last** hook before the HTML is written to disk.
   *
   * Use for: post-processing, minification, link rewriting, custom injection.
   *
   * @param callback - Receives HTML string and full page context. Return modified HTML.
   *
   * @example
   * build.transformHtml((html, ctx) => {
   *   return html.replace(/https?:\/\/old-domain\.com\//g, "/");
   * });
   */
  transformHtml(callback: (html: string, context: PageContext) => string | Promise<string>): void;

  // ─── Head & Script Injection ───────────────────────────

  /**
   * Register a callback that returns HTML strings to inject inside `<head>`.
   * Results from all plugins are merged and deduplicated.
   *
   * Use for: analytics snippets, meta tags, stylesheet links.
   *
   * @param callback - Returns a single HTML string or an array. Called once per page.
   *
   * @example
   * build.injectHead(() => {
   *   return `<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXX"></script>`;
   * });
   */
  injectHead(callback: (context: PageContext) => string | string[]): void;

  /**
   * Register a callback that returns HTML strings to inject before `</body>`.
   * Results from all plugins are merged and deduplicated.
   *
   * Use for: chat widgets, live-script loaders, deferred scripts.
   *
   * @param callback - Returns a single HTML string or an array. Called once per page.
   */
  injectBody(callback: (context: PageContext) => string | string[]): void;

  // ─── MDX Pipeline Extension ────────────────────────────

  /**
   * Register additional remark (Markdown) plugins for the MDX compilation pipeline.
   * Plugins from all plugins are merged and applied **after** the default set.
   *
   * @example
   * build.remarkPlugins(() => [require("remark-custom-heading-id")]);
   */
  remarkPlugins(callback: () => Pluggable[]): void;

  /**
   * Register additional rehype (HTML) plugins for the MDX compilation pipeline.
   * Plugins from all plugins are merged and applied **after** the default set.
   *
   * @example
   * build.rehypePlugins(() => [require("rehype-autolink-headings")]);
   */
  rehypePlugins(callback: () => Pluggable[]): void;

  // ─── Dev Server ────────────────────────────────────────

  /**
   * Register a callback to intercept incoming requests during development.
   * The **first** callback to return a `Response` short-circuits all subsequent handlers.
   *
   * Use for: custom API routes, mock data endpoints, redirects, request logging.
   *
   * @param callback - Receives the Request and dev server context. Return Response or void.
   *
   * @example
   * build.handleRequest((req, ctx) => {
   *   if (new URL(req.url).pathname === "/api/status") {
   *     return new Response(JSON.stringify({ ok: true }), {
   *       headers: { "Content-Type": "application/json" },
   *     });
   *   }
   * });
   */
  handleRequest(
    callback: (
      req: Request,
      context: DevServerContext
    ) => Response | void | Promise<Response | void>
  ): void;
}

// ─── Plugin Interface ────────────────────────────────────

/**
 * A DocuBook plugin.
 *
 * Follows Bun's `BunPlugin` convention:
 * - `name`: unique identifier for the plugin
 * - `setup(build)`: called once to register lifecycle hooks via the provided `PluginBuilder`
 *
 * @example
 * const myPlugin: DocuBookPlugin = {
 *   name: "analytics",
 *   setup(build) {
 *     build.injectHead(() => `<script>...</script>`);
 *     build.onEnd(() => console.log("build done"));
 *   },
 * };
 */
export interface DocuBookPlugin {
  /** Unique plugin name. Used in error messages and logs. */
  name: string;

  /**
   * Called once after all plugins are loaded and before the build begins.
   * Register all lifecycle hooks via the `build` (PluginBuilder) parameter.
   *
   * @param build - The PluginBuilder instance for this build session.
   */
  setup(build: PluginBuilder): void | Promise<void>;
}
