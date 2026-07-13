/**
 * Shared test helpers for plugin system tests.
 * Extracted to keep tests DRY — avoid duplicating config builders
 * and boilerplate across plugin.test.ts, plugin-integration.test.ts,
 * and plugin-loader.test.ts.
 */
import { BuildPluginBuilder } from "../node/plugin-builder";
import type { DocuBookPlugin } from "../node/plugin";
import type { HtmlShellOptions } from "../node/html.shared";

// ─── Minimal DocuConfig ─────────────────────────────────

export interface TestDocuConfig {
  meta: { title: string; description: string; baseURL: string };
  navbar: { logoText: string; menu: never[] };
  footer: { social: never[] };
  repo: { url: string; path: string; edit: boolean };
  routes: never[];
  plugins: { name: string }[];
  [key: string]: unknown;
}

/**
 * Create a minimal DocuConfig for testing.
 * @param pluginNames - Optional plugin specifiers to include (default empty).
 */
export function createMinimalConfig(pluginNames: string[] = []): TestDocuConfig {
  return {
    meta: { title: "Test", description: "Test", baseURL: "https://test.dev" },
    navbar: { logoText: "Test", menu: [] },
    footer: { social: [] },
    repo: { url: "", path: "", edit: false },
    routes: [],
    plugins: pluginNames.map((name) => ({ name })),
  };
}

// ─── BuildPluginBuilder factory ─────────────────────────

export function createBuilder(pluginNames: string[] = []): BuildPluginBuilder {
  return new BuildPluginBuilder(createMinimalConfig(pluginNames) as any);
}

// ─── Default htmlShell options (avoids repeating favicon/css/js 4×) ──

export const BASE_HTML_OPTS: Pick<
  HtmlShellOptions,
  "title" | "description" | "favicon" | "css" | "js"
> = {
  title: "Test",
  description: "Test",
  favicon: "/favicon.ico",
  css: "style.css",
  js: "app.js",
};

/**
 * Create a full HtmlShellOptions from a custom body + extra fields.
 */
export function htmlOpts(body: string, overrides?: Partial<HtmlShellOptions>): HtmlShellOptions {
  return { ...BASE_HTML_OPTS, body, ...overrides } as HtmlShellOptions;
}

// ─── DevServerContext shortcut ──────────────────────────

import type { DevServerContext } from "../node/plugin";

export function devCtx(overrides?: Partial<DevServerContext>): DevServerContext {
  return { port: 3000, hostname: "localhost", ...overrides };
}

// ─── PageContext shortcut ───────────────────────────────

import type { PageContext } from "../node/plugin";

export function pageCtx(overrides?: Partial<PageContext>): PageContext {
  return {
    slug: "test",
    filePath: "test.mdx",
    frontmatter: {},
    content: "",
    config: createMinimalConfig() as any,
    ...overrides,
  } as PageContext;
}

// ─── Mock Plugin: tracks all 10 hooks ───────────────────

export interface HookLog {
  hook: string;
  args: unknown[];
  timestamp: number;
}

export interface MockPlugin extends DocuBookPlugin {
  logs: HookLog[];
}

export function createMockPlugin(name: string): MockPlugin {
  const logs: HookLog[] = [];

  const log = (hook: string, ...args: unknown[]) => {
    logs.push({ hook, args, timestamp: Date.now() });
  };

  return {
    name,
    logs,
    setup(build) {
      log("setup");

      build.onStart((config) => {
        log("onStart", config);
      });

      build.onLoad({ filter: /\.mdx$/ }, ({ path: filePath, content }) => {
        log("onLoad", filePath);
        return {
          contents: content.replace(/\bHello\b/g, "Hi"),
          loader: "js",
        };
      });

      build.transformFrontmatter((frontmatter, ctx) => {
        log("transformFrontmatter", ctx.slug);
        return { ...frontmatter, processed: true, pluginName: name };
      });

      build.injectHead((ctx) => {
        log("injectHead", ctx.slug);
        return `<meta name="plugin" content="${name}">`;
      });

      build.injectBody((ctx) => {
        log("injectBody", ctx.slug);
        return '<div id="plugin-widget">Plugin Widget</div>';
      });

      build.remarkPlugins(() => {
        log("remarkPlugins");
        return [];
      });

      build.rehypePlugins(() => {
        log("rehypePlugins");
        return [];
      });

      build.transformHtml((html, ctx) => {
        log("transformHtml", ctx.slug);
        return html.replace("</body>", "<!-- Plugin Footer -->\n</body>");
      });

      build.onEnd((_config, pages) => {
        log("onEnd", pages.length);
      });

      build.handleRequest((req, _ctx) => {
        log("handleRequest", req.url);
        return undefined;
      });
    },
  };
}

// ─── Faulty plugin factory ──────────────────────────────

export function createFaultyPlugin(
  hook: "onStart" | "handleRequest" | "injectHead"
): DocuBookPlugin {
  const errorMsg = `${hook} failure`;
  return {
    name: "faulty",
    setup(build) {
      if (hook === "onStart") {
        build.onStart(() => {
          throw new Error(errorMsg);
        });
      } else if (hook === "handleRequest") {
        build.handleRequest(() => {
          throw new Error(errorMsg);
        });
      } else if (hook === "injectHead") {
        build.injectHead(() => {
          throw new Error(errorMsg);
        });
      }
    },
  };
}
