import type { Pluggable } from "unified";
import type { DocuConfig, PageContext, PageMeta, DevServerContext, PluginBuilder } from "./plugin";

// ─── Utility Types ───────────────────────────────────────

type Awaitable<T> = T | Promise<T>;

// ─── Internal Handler Storage Types ──────────────────────

interface OnLoadHandler {
  filter: RegExp;
  namespace?: string;
  fn: (args: {
    path: string;
    content: string;
  }) => Awaitable<{ contents?: string; loader?: "js" | "ts" | "mdx" } | void>;
}

// ─── BuildPluginBuilder ──────────────────────────────────

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

  collectBody(context: PageContext): string[] {
    const items: string[] = [];
    for (const cb of this._injectBody) {
      try {
        const result = cb(context);
        if (result) {
          if (Array.isArray(result)) {
            items.push(...result);
          } else {
            items.push(result);
          }
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

  collectHead(context: PageContext): string[] {
    const items: string[] = [];
    for (const cb of this._injectHead) {
      try {
        const result = cb(context);
        if (result) {
          if (Array.isArray(result)) {
            items.push(...result);
          } else {
            items.push(result);
          }
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

  handleRequest(
    callback: (req: Request, context: DevServerContext) => Awaitable<Response | void>
  ): void {
    this._handleRequest.push(callback);
  }

  injectBody(callback: (context: PageContext) => string | string[]): void {
    this._injectBody.push(callback);
  }

  injectHead(callback: (context: PageContext) => string | string[]): void {
    this._injectHead.push(callback);
  }

  onEnd(callback: (config: DocuConfig, pages: PageMeta[]) => Awaitable<void>): void {
    this._onEnd.push(callback);
  }

  onLoad(
    args: { filter: RegExp; namespace?: string },
    callback: (args: {
      path: string;
      content: string;
    }) => Awaitable<{ contents?: string; loader?: "js" | "ts" | "mdx" } | void>
  ): void {
    this._onLoad.push({ ...args, fn: callback });
  }

  onStart(callback: (config: DocuConfig) => Awaitable<void>): void {
    this._onStart.push(callback);
  }

  rehypePlugins(callback: () => Pluggable[]): void {
    this._rehypePlugins.push(callback);
  }

  remarkPlugins(callback: () => Pluggable[]): void {
    this._remarkPlugins.push(callback);
  }

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

  async runOnEnd(pages: PageMeta[]): Promise<void> {
    for (let i = 0; i < this._onEnd.length; i++) {
      try {
        await this._onEnd[i](this.config, pages);
      } catch (err) {
        throw new Error(
          `[plugin] onEnd callback #${i + 1} failed: ${err instanceof Error ? err.message : String(err)}`,
          { cause: err }
        );
      }
    }
  }

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
          throw new Error(
            `[plugin] onLoad handler for filter ${handler.filter} failed: ${err instanceof Error ? err.message : String(err)}`,
            { cause: err }
          );
        }
      }
    }
    return null;
  }

  async runOnStart(): Promise<void> {
    for (let i = 0; i < this._onStart.length; i++) {
      try {
        await this._onStart[i](this.config);
      } catch (err) {
        throw new Error(
          `[plugin] onStart callback #${i + 1} failed: ${err instanceof Error ? err.message : String(err)}`,
          { cause: err }
        );
      }
    }
  }

  async runTransformFrontmatterChain(
    frontmatter: Record<string, unknown>,
    context: Pick<PageContext, "slug" | "filePath" | "content">
  ): Promise<Record<string, unknown>> {
    let result = frontmatter;
    for (let i = 0; i < this._transformFrontmatter.length; i++) {
      try {
        const next = await this._transformFrontmatter[i](result, context);
        if (next !== undefined && next !== null) {
          result = next;
        }
      } catch (err) {
        throw new Error(
          `[plugin] transformFrontmatter callback #${i + 1} failed: ${err instanceof Error ? err.message : String(err)}`,
          { cause: err }
        );
      }
    }
    return result;
  }

  async runTransformHtmlChain(html: string, context: PageContext): Promise<string> {
    let result = html;
    for (let i = 0; i < this._transformHtml.length; i++) {
      try {
        result = await this._transformHtml[i](result, context);
      } catch (err) {
        throw new Error(
          `[plugin] transformHtml callback #${i + 1} failed: ${err instanceof Error ? err.message : String(err)}`,
          { cause: err }
        );
      }
    }
    return result;
  }

  transformFrontmatter(
    callback: (
      frontmatter: Record<string, unknown>,
      context: Pick<PageContext, "slug" | "filePath" | "content">
    ) => Awaitable<Record<string, unknown> | void>
  ): void {
    this._transformFrontmatter.push(callback);
  }

  transformHtml(callback: (html: string, context: PageContext) => Awaitable<string>): void {
    this._transformHtml.push(callback);
  }
}
