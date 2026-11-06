/**
 * Client contract for plugins that replace the built-in search.
 *
 * A search plugin declares itself on docs pages with a JSON block, usually
 * through `injectHead`:
 *
 *   <script type="application/json" id="docubook-search-provider">
 *     {"module":"docsearch/client.js","askAi":true, ...plugin options}
 *   </script>
 *
 * `module` is a path relative to the bundle directory — the directory a plugin
 * writes to through `BuildEndContext.assetsDir` and serves in dev under
 * `DevServerContext.assetsPath`. Flame keeps rendering its own search bar and
 * shortcuts, and imports the module the first time the reader asks for search.
 * The module's default export receives the parsed JSON and returns the
 * `SearchProvider` that opens the plugin's UI. `askAi: true` adds an Ask AI
 * button that calls `provider.askAi()`, a surface separate from search.
 */

export const SEARCH_PROVIDER_ELEMENT_ID = "docubook-search-provider";

export interface SearchProviderConfig {
  /** Module path relative to the bundle directory, e.g. `docsearch/client.js`. */
  module: string;
  /** Whether the provider has an Ask AI surface (adds the Ask AI buttons). */
  askAi?: boolean;
  /** Provider-specific options, passed through to the module. */
  [key: string]: unknown;
}

export interface SearchProvider {
  /** Open the keyword search UI. */
  open(): void;
  /**
   * Open the Ask AI UI, or close it when it is already open (the Ctrl/⌘ I
   * shortcut toggles). Only called when the config sets `askAi: true`.
   */
  askAi?(): void;
}

export type SearchProviderFactory = (
  config: SearchProviderConfig
) => SearchProvider | Promise<SearchProvider>;

export type SearchProviderAction = "search" | "askAi";

// A relative path inside the bundle directory: no scheme, no protocol-relative
// or root-absolute form, no `..` segment. The page itself is trusted (plugins
// write it), but the module URL is built by string concatenation, so anything
// that could escape the bundle directory is refused rather than imported.
const SAFE_MODULE_RE = /^(?![./\\])(?!.*(?:^|\/)\.\.(?:\/|$))[\w@.\-/]+\.m?js(?:\?[\w.=&-]*)?$/;

/** Parse and validate a provider declaration. Returns null when absent or invalid. */
export function parseSearchProviderConfig(
  raw: string | null | undefined
): SearchProviderConfig | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(`[search] #${SEARCH_PROVIDER_ELEMENT_ID} is not valid JSON`);
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const config = parsed as SearchProviderConfig;
  if (typeof config.module !== "string" || !SAFE_MODULE_RE.test(config.module)) {
    console.error(
      `[search] #${SEARCH_PROVIDER_ELEMENT_ID} needs a "module" path relative to the bundle directory`
    );
    return null;
  }
  return config;
}

/** Read the provider declaration from the current document, if any. */
export function readSearchProviderConfig(): SearchProviderConfig | null {
  if (typeof document === "undefined") return null;
  return parseSearchProviderConfig(
    document.getElementById(SEARCH_PROVIDER_ELEMENT_ID)?.textContent
  );
}

/** URL of the provider module: inside the bundle directory of the deployed dist. */
export function searchProviderUrl(
  config: SearchProviderConfig,
  deployPath: string,
  bundlePath: string
): string {
  return `${deployPath}${bundlePath}/${config.module}`;
}

let pending: { url: string; provider: Promise<SearchProvider> } | null = null;

/**
 * Import the provider module once per URL and build the provider. A failed
 * import is not cached, so the next request retries (a flaky network should
 * not disable search until a reload).
 */
export function loadSearchProvider(
  config: SearchProviderConfig,
  url: string,
  importModule: (url: string) => Promise<{ default?: unknown }> = (u) =>
    import(/* @vite-ignore */ u)
): Promise<SearchProvider> {
  if (pending?.url === url) return pending.provider;
  const provider = importModule(url).then(async (mod) => {
    if (typeof mod.default !== "function") {
      throw new Error(`[search] ${url} has no default export to create the search provider`);
    }
    return await (mod.default as SearchProviderFactory)(config);
  });
  pending = { url, provider };
  provider.catch(() => {
    if (pending?.provider === provider) pending = null;
  });
  return provider;
}

/** Run a provider action, loading the provider first when needed. */
export async function runSearchProvider(
  action: SearchProviderAction,
  config: SearchProviderConfig,
  url: string,
  importModule?: (url: string) => Promise<{ default?: unknown }>
): Promise<void> {
  try {
    const provider = await loadSearchProvider(config, url, importModule);
    if (action === "askAi") {
      if (config.askAi) provider.askAi?.();
    } else {
      provider.open();
    }
  } catch (error) {
    console.error("[search] could not load the search provider", error);
  }
}

/** @internal Reset the module cache between tests. */
export function resetSearchProviderCache(): void {
  pending = null;
}
