/**
 * @docubook/plugin-search-algolia
 *
 * Replaces flame's built-in search with Algolia DocSearch. Flame keeps its own
 * search bar, Ctrl/⌘ K, and (with `askAi`) a Sparkles button plus Ctrl/⌘ I;
 * this plugin supplies what they open:
 *
 * - the DocSearch dialog, keyword search only (`@docsearch/js/docsearch`);
 * - the DocSearch Sidepanel for Ask AI (`@docsearch/sidepanel-js`), a
 *   separate surface, so questions never mix with search results.
 *
 * The browser code is built into `dist/client/` and copied beside flame's
 * hashed bundles, so it is served from the site's own origin (`script-src
 * 'self'`) and only downloaded when the reader first opens search or Ask AI.
 */

import { cp, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { DocuBookPlugin } from "@docubook/flame";
import { resolveOptions, serializeForScript, type AlgoliaSearchOptions } from "./options";

export type { AlgoliaSearchOptions, AskAiOptions } from "./options";

declare const __PLUGIN_VERSION__: string;

/** Directory, inside flame's bundle directory, that holds the browser code. */
export const CLIENT_SUBDIR = "docsearch";

/** Element ID flame reads the provider declaration from. */
const PROVIDER_ELEMENT_ID = "docubook-search-provider";

const CONTENT_TYPES: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

/**
 * `dist/client/` next to this module once built. Not `new URL("./client/",
 * import.meta.url)`: Vite would inline that reference as a data URL.
 */
function defaultClientDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "client");
}

export interface PluginInternals {
  /** @internal Override the browser build location (tests). */
  clientDir?: string;
}

export default function pluginSearchAlgolia(
  options?: AlgoliaSearchOptions,
  internals: PluginInternals = {}
): DocuBookPlugin {
  const version = typeof __PLUGIN_VERSION__ === "string" ? __PLUGIN_VERSION__ : "dev";
  // The version query busts the long-lived `/assets/*` cache of hosts such as
  // Vercel when the plugin is upgraded: the file name itself never changes.
  const config = resolveOptions(options, `${CLIENT_SUBDIR}/client.js?v=${version}`);
  const clientDir = internals.clientDir ?? defaultClientDir();

  const head = [
    // Warm up the connection to the search cluster while the page is read.
    `<link rel="preconnect" href="https://${config.search.appId}-dsn.algolia.net" crossorigin>`,
    `<script type="application/json" id="${PROVIDER_ELEMENT_ID}">${serializeForScript(config)}</script>`,
  ];

  return {
    name: "search-algolia",
    setup(build) {
      // Search lives in the docs sidebar; home and 404 pages have none.
      build.injectHead((ctx) => (ctx.pageType === "docs" ? head : []));

      build.onEnd(async (_config, _pages, { assetsDir }) => {
        await cp(clientDir, join(assetsDir, CLIENT_SUBDIR), { recursive: true });
      });

      build.handleRequest(async (req, { assetsPath }) => {
        const { pathname } = new URL(req.url);
        const prefix = `${assetsPath}/${CLIENT_SUBDIR}/`;
        if (!pathname.startsWith(prefix)) return;
        const file = await resolveClientFile(clientDir, pathname.slice(prefix.length));
        if (!file) return new Response("Not found", { status: 404 });
        return new Response(await readFile(file), {
          headers: {
            "Content-Type": CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
            "Cache-Control": "no-cache",
          },
        });
      });
    },
  };
}

/**
 * Map a request path below the client prefix to a file in `clientDir`, or
 * null. Only plain relative segments are accepted, so `..`, encoded
 * separators, and absolute paths cannot reach outside the directory.
 */
export async function resolveClientFile(
  clientDir: string,
  relative: string
): Promise<string | null> {
  let decoded: string;
  try {
    decoded = decodeURIComponent(relative);
  } catch {
    return null;
  }
  const segments = decoded.split("/");
  if (segments.some((segment) => !/^[\w@-][\w.@-]*$/.test(segment) || segment.includes(".."))) {
    return null;
  }
  const file = join(clientDir, ...segments);
  const root = clientDir.endsWith(sep) ? clientDir : clientDir + sep;
  if (!file.startsWith(root)) return null;
  try {
    return (await stat(file)).isFile() ? file : null;
  } catch {
    return null;
  }
}
