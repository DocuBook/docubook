import type { Pluggable } from "unified";
import type { DocuConfig, PageContext, PageMeta, DevServerContext, PluginBuilder } from "./plugin";

type Awaitable<T> = T | Promise<T>;

interface OnLoadHandler {
  filter: RegExp;
  namespace?: string;
  fn: (args: {
    path: string;
    content: string;
  }) => Awaitable<{ contents?: string; loader?: "js" | "ts" | "mdx" } | void>;
}

export class BuildPluginBuilder implements PluginBuilder {
  readonly config: DocuConfig;

  private _handleRequest: Array<
    (req: Request, context: DevServerContext) => Awaitable<Response | void>
  > = [];
  private _injectBody: Array<(context: PageContext) => string | string[]> = [];
  private _injectHead: Array<(context: PageContext) => string | string[]> = [];
  private _onEnd: Array<(config: DocuConfig, pages: PageMeta[]) => Awaitable<void>> = [];
  private _onLoad: OnLoadHandler[] = [];
  private _onStart: Array<(config: DocuConfig) => Awaitable<void>> = [];
  private _rehypePlugins: Array<() => Pluggable[]> = [];
  private _remarkPlugins: Array<() => Pluggable[]> = [];
  private _transformFrontmatter: Array<
    (
      frontmatter: Record<string, unknown>,
      context: Pick<PageContext, "slug" | "filePath" | "content">
    ) => Awaitable<Record<string, unknown> | void>
  > = [];
  private _transformHtml: Array<(html: string, context: PageContext) => Awaitable<string>> = [];

  constructor(config: DocuConfig) {
    this.config = config;
  }

  /**
   * Collect and deduplicate all `<body>` injection snippets from registered plugins.
   * Each callback is executed in registration order; plugin errors are wrapped
   * with a descriptive message.
   *
   * @param context - Current page context passed to each injectBody callback.
   * @returns Deduplicated array of HTML strings to inject before `</body>`.
   * @throws Error if any injectBody callback throws — wraps original error as cause.
   */
  collectBody(context: PageContext): string[] {
    const items: string[] = [];
    for (const cb of this._injectBody) {
      try {
        const result = cb(context);
        if (result) {
          this.collectItems(items, result, "injectBody");
        }
      } catch (err) {
        throw new Error(
          `[plugin] injectBody callback failed: ${err instanceof Error ? err.message : String(err)}`,
          { cause: err }
        );
      }
    }
    return [...new Set(items)];
  }

  /**
   * Collect and deduplicate all `<head>` injection snippets from registered plugins.
   * Each callback is executed in registration order; plugin errors are wrapped
   * with a descriptive message.
   *
   * @param context - Current page context passed to each injectHead callback.
   * @returns Deduplicated array of HTML strings to inject before `</head>`.
   * @throws Error if any injectHead callback throws — wraps original error as cause.
   */
  collectHead(context: PageContext): string[] {
    const items: string[] = [];
    for (const cb of this._injectHead) {
      try {
        const result = cb(context);
        if (result) {
          this.collectItems(items, result, "injectHead");
        }
      } catch (err) {
        throw new Error(
          `[plugin] injectHead callback failed: ${err instanceof Error ? err.message : String(err)}`,
          { cause: err }
        );
      }
    }
    return [...new Set(items)];
  }

  /**
   * Collect all rehype plugin arrays from registered rehypePlugins callbacks.
   * Results from all plugins are flattened into a single array.
   *
   * @returns Flattened array of rehype plugin instances applied after default set.
   * @throws Error if any rehypePlugins callback throws — wraps original error as cause.
   */
  collectRehypePlugins(): Pluggable[] {
    const plugins: Pluggable[] = [];
    for (const cb of this._rehypePlugins) {
      try {
        plugins.push(...cb());
      } catch (err) {
        throw new Error(
          `[plugin] rehypePlugins callback failed: ${err instanceof Error ? err.message : String(err)}`,
          { cause: err }
        );
      }
    }
    return plugins;
  }

  /**
   * Collect all remark plugin arrays from registered remarkPlugins callbacks.
   * Results from all plugins are flattened into a single array.
   *
   * @returns Flattened array of remark plugin instances applied after default set.
   * @throws Error if any remarkPlugins callback throws — wraps original error as cause.
   */
  collectRemarkPlugins(): Pluggable[] {
    const plugins: Pluggable[] = [];
    for (const cb of this._remarkPlugins) {
      try {
        plugins.push(...cb());
      } catch (err) {
        throw new Error(
          `[plugin] remarkPlugins callback failed: ${err instanceof Error ? err.message : String(err)}`,
          { cause: err }
        );
      }
    }
    return plugins;
  }

  /**
   * Register a callback to intercept incoming requests during development.
   * The **first** callback to return a `Response` short-circuits all subsequent handlers.
   * Errors inside callbacks are caught and logged — execution continues to next handler.
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
    callback: (req: Request, context: DevServerContext) => Awaitable<Response | void>
  ): void {
    this._handleRequest.push(callback);
  }

  /**
   * Register a callback that returns HTML strings to inject before `</body>`.
   * Results from all plugins are merged, deduplicated, and served via `collectBody()`.
   *
   * @param callback - Returns a single HTML string or an array. Called once per page.
   *
   * @example
   * build.injectBody(() => `<div id="chat-widget"></div>`);
   */
  injectBody(callback: (context: PageContext) => string | string[]): void {
    this._injectBody.push(callback);
  }

  /**
   * Register a callback that returns HTML strings to inject inside `<head>`.
   * Results from all plugins are merged, deduplicated, and served via `collectHead()`.
   *
   * @param callback - Returns a single HTML string or an array. Called once per page.
   *
   * @example
   * build.injectHead(() => `<script async src="https://cdn.example.com/analytics.js"></script>`);
   */
  injectHead(callback: (context: PageContext) => string | string[]): void {
    this._injectHead.push(callback);
  }

  /**
   * Register a callback to run once after all pages are built.
   * Receives the resolved config and aggregated page metadata.
   * Errors thrown by the callback propagate to the caller via `runOnEnd()`.
   *
   * @param callback - Receives config and page metadata array. May return a Promise.
   *
   * @example
   * build.onEnd((config, pages) => {
   *   const xml = generateSitemap(pages, config.meta.baseURL);
   *   await Bun.write(".docu/dist/sitemap.xml", xml);
   * });
   */
  onEnd(callback: (config: DocuConfig, pages: PageMeta[]) => Awaitable<void>): void {
    this._onEnd.push(callback);
  }

  /**
   * Register a callback to transform raw file content before MDX compilation.
   * Filtered by regex against the file's relative path — only the **first** matching
   * handler's result is used.
   * Errors thrown by the callback propagate to the caller via `runOnLoad()`.
   *
   * @param args.filter - RegExp matched against the file's relative path.
   * @param args.namespace - Optional namespace prefix (reserved for future use).
   * @param callback - Receives file path and raw content. Return new contents or void.
   *
   * @example
   * build.onLoad({ filter: /\.md$/ }, ({ path, content }) => {
   *   return { contents: `<!-- preprocessed -->\n${content}`, loader: "mdx" };
   * });
   */
  onLoad(
    args: { filter: RegExp; namespace?: string },
    callback: (args: {
      path: string;
      content: string;
    }) => Awaitable<{ contents?: string; loader?: "js" | "ts" | "mdx" } | void>
  ): void {
    this._onLoad.push({ ...args, fn: callback });
  }

  /**
   * Register a callback to run once before the build starts.
   * Receives the resolved DocuConfig for validation or resource initialization.
   * Errors thrown by the callback propagate to the caller via `runOnStart()`.
   *
   * @param callback - Receives the resolved config. May return a Promise.
   *
   * @example
   * build.onStart((config) => {
   *   if (!config.meta.baseURL) throw new Error("baseURL required");
   * });
   */
  onStart(callback: (config: DocuConfig) => Awaitable<void>): void {
    this._onStart.push(callback);
  }

  /**
   * Register additional rehype (HTML) plugins for the MDX compilation pipeline.
   * Results from all plugins are merged and applied **after** the default set.
   *
   * @param callback - Returns an array of rehype plugins.
   *
   * @example
   * build.rehypePlugins(() => [require("rehype-autolink-headings")]);
   */
  rehypePlugins(callback: () => Pluggable[]): void {
    this._rehypePlugins.push(callback);
  }

  /**
   * Register additional remark (Markdown) plugins for the MDX compilation pipeline.
   * Results from all plugins are merged and applied **after** the default set.
   *
   * @param callback - Returns an array of remark plugins.
   *
   * @example
   * build.remarkPlugins(() => [require("remark-custom-heading-id")]);
   */
  remarkPlugins(callback: () => Pluggable[]): void {
    this._remarkPlugins.push(callback);
  }

  /**
   * Execute all registered handleRequest callbacks sequentially.
   * Stops and returns the **first** `Response` returned by any callback.
   * Errors inside individual callbacks are caught and logged — execution
   * continues to the next callback without throwing.
   *
   * @param req - The incoming HTTP Request.
   * @param context - Dev server context (port, hostname).
   * @returns A Response if a callback intercepted the request, or null if none did.
   */
  async runHandleRequest(req: Request, context: DevServerContext): Promise<Response | null> {
    for (let i = 0; i < this._handleRequest.length; i++) {
      try {
        const result = await this._handleRequest[i](req, context);
        if (result instanceof Response) {
          return result;
        }
      } catch (err) {
        console.error(
          `[plugin] handleRequest callback #${i + 1} error: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
    return null;
  }

  /**
   * Execute all registered onEnd callbacks sequentially with the resolved
   * config and aggregated page metadata.
   * Errors inside individual callbacks are caught and logged — execution
   * continues to the next callback without throwing.
   *
   * @param pages - Array of metadata for every built page.
   */
  async runOnEnd(pages: PageMeta[]): Promise<void> {
    for (let i = 0; i < this._onEnd.length; i++) {
      try {
        await this._onEnd[i](this.config, pages);
      } catch (err) {
        console.error(
          `[plugin] onEnd callback #${i + 1} error: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  /**
   * Execute registered onLoad handlers in registration order against a file.
   * Only the **first** handler whose `filter` regex matches the path and returns
   * a result is applied. If a matching handler throws, the error is logged and
   * subsequent handlers are tried.
   *
   * @param path - Relative path of the file being loaded.
   * @param content - Raw file content.
   * @returns Transformed content if a matching handler returned it, or null.
   */
  async runOnLoad(
    path: string,
    content: string
  ): Promise<{ contents?: string; loader?: "js" | "ts" | "mdx" } | null> {
    for (const handler of this._onLoad) {
      if (handler.filter.test(path)) {
        try {
          const result = await handler.fn({ path, content });
          if (result) return result;
        } catch (err) {
          console.error(
            `[plugin] onLoad handler for filter ${handler.filter} error: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }
    return null;
  }

  /**
   * Execute all registered onStart callbacks sequentially.
   * Each callback receives the resolved DocuConfig.
   * Errors inside individual callbacks are caught and logged — execution
   * continues to the next callback without throwing.
   */
  async runOnStart(): Promise<void> {
    for (let i = 0; i < this._onStart.length; i++) {
      try {
        await this._onStart[i](this.config);
      } catch (err) {
        console.error(
          `[plugin] onStart callback #${i + 1} error: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  /**
   * Execute the transformFrontmatter chain in waterfall pattern.
   * Each callback receives the **previous** callback's return value (or the
   * original frontmatter for the first). Callbacks that return `undefined` or
   * `null` pass the current value through unchanged.
   * Callbacks that return a non-object (string, number, array) are skipped
   * with a console warning — only plain objects are accepted.
   * Errors inside individual callbacks are caught and logged — the current
   * frontmatter passes through unchanged for that step.
   *
   * @param frontmatter - Initial frontmatter object parsed from MDX.
   * @param context - Page context with slug, filePath, and raw content.
   * @returns The final transformed frontmatter object.
   */
  async runTransformFrontmatterChain(
    frontmatter: Record<string, unknown>,
    context: Pick<PageContext, "slug" | "filePath" | "content">
  ): Promise<Record<string, unknown>> {
    let result = frontmatter;
    for (let i = 0; i < this._transformFrontmatter.length; i++) {
      try {
        const next = await this._transformFrontmatter[i](result, context);
        if (next !== undefined && next !== null) {
          if (typeof next === "object" && !Array.isArray(next)) {
            result = next;
          } else {
            console.warn(
              `[plugin] transformFrontmatter callback #${i + 1} returned invalid type (expected a plain object), skipping`
            );
          }
        }
      } catch (err) {
        console.error(
          `[plugin] transformFrontmatter callback #${i + 1} error: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
    return result;
  }

  /**
   * Execute the transformHtml chain in pipeline pattern.
   * Each callback receives the **previous** callback's return value (or the
   * original HTML for the first). Every callback **must** return a string.
   * Errors inside individual callbacks are caught and logged — the current
   * HTML passes through unchanged for that step.
   *
   * @param html - The initial HTML string.
   * @param context - Full page context (slug, filePath, frontmatter, content, config).
   * @returns The final transformed HTML string.
   */
  async runTransformHtmlChain(html: string, context: PageContext): Promise<string> {
    let result = html;
    for (let i = 0; i < this._transformHtml.length; i++) {
      try {
        result = await this._transformHtml[i](result, context);
      } catch (err) {
        console.error(
          `[plugin] transformHtml callback #${i + 1} error: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
    return result;
  }

  /**
   * Register a callback to mutate frontmatter before MDX compilation.
   * Callbacks are chained in a waterfall: the return value of one is passed
   * as input to the next. Return `undefined` to pass through unchanged.
   *
   * **Note:** Only plain objects are accepted as return values. Returning
   * a string, number, or array will be silently skipped with a warning.
   * Plugin authors should validate their return values before returning.
   *
   * @param callback - Receives frontmatter object and page context.
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
    ) => Awaitable<Record<string, unknown> | void>
  ): void {
    this._transformFrontmatter.push(callback);
  }

  /**
   * Register a callback to transform the final HTML string per page.
   * This is the **last** hook before the HTML is written to disk.
   * Callbacks are chained in a pipeline: each receives the previous callback's output.
   *
   * @param callback - Receives HTML string and full page context. Must return HTML.
   *
   * @example
   * build.transformHtml((html, ctx) => {
   *   return html.replace(/https?:\/\/old-domain\.com\//g, "/");
   * });
   */
  transformHtml(callback: (html: string, context: PageContext) => Awaitable<string>): void {
    this._transformHtml.push(callback);
  }

  /**
   * Collect items from a callback result, filtering only valid strings.
   * Non-string items and unexpected types are logged as warnings.
   */
  private collectItems(items: string[], result: string | string[], hookName: string): void {
    if (Array.isArray(result)) {
      for (const item of result) {
        if (typeof item === "string") {
          items.push(item);
        } else {
          console.warn(
            `[plugin] ${hookName} callback returned non-string item (got ${typeof item}), skipping`
          );
        }
      }
    } else if (typeof result === "string") {
      items.push(result);
    } else {
      console.warn(
        `[plugin] ${hookName} callback returned unexpected type (got ${typeof result}), expected string or string[], skipping`
      );
    }
  }
}
