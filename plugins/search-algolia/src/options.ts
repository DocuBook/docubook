/**
 * Plugin options from `docu.json`, their validation, and the JSON the plugin
 * hands to the browser. Pure functions: no file system, no flame imports, so
 * they are unit-testable and safe to reason about in isolation.
 */

/** Ask AI options. A string is shorthand for `{ agentId }`. */
export interface AskAiOptions {
  /** Agent Studio agent ID that answers questions. */
  agentId: string;
  /** App ID hosting the agent, when it differs from the search `appId`. */
  appId?: string;
  /** Search-only API key for the agent, when it differs from `apiKey`. */
  apiKey?: string;
  /** Index names the agent's search tool may query. */
  indices?: string[];
  /** Show suggested questions on the new-conversation screen. */
  suggestedQuestions?: boolean;
  /** Per-index search parameters for the agent, keyed by index name. */
  searchParameters?: Record<string, Record<string, unknown>>;
  /** `floating` covers the page (default); `inline` pushes it aside. */
  variant?: "floating" | "inline";
  /** Side the panel slides in from. Default `right`. */
  side?: "left" | "right";
  /** Panel width (px or any CSS width). DocSearch default: `360px`. */
  width?: number | string;
  /** Panel width when expanded. DocSearch default: `580px`. */
  expandedWidth?: number | string;
  /** DocSearch Sidepanel translations (`panel.translations`). */
  translations?: Record<string, unknown>;
}

export interface AlgoliaSearchOptions {
  /** Algolia application ID. */
  appId: string;
  /** Search-only API key. Never the Admin API key. */
  apiKey: string;
  /** Index the DocSearch crawler writes to. */
  indexName: string;
  /** Algolia search parameters for the keyword index (e.g. `facetFilters`). */
  searchParameters?: Record<string, unknown>;
  /** Placeholder of the search input. */
  placeholder?: string;
  /** Maximum hits per group in the dialog. */
  maxResultsPerGroup?: number;
  /** Do not store recent and favorite searches in local storage. */
  disableUserPersonalization?: boolean;
  /** DocSearch modal translations (`translations`). */
  translations?: Record<string, unknown>;
  /**
   * Keep hit links on their own origin instead of the crawled one, so a local
   * `flame dev` or a preview deployment does not jump to production. Default
   * `true`.
   */
  relativeUrls?: boolean;
  /**
   * Agent ID (or options) for Ask AI. Ask AI opens in the DocSearch side
   * panel, never inside the search dialog. Omit to ship keyword search only.
   */
  askAi?: string | AskAiOptions;
}

/** Keyword search part of the browser config, mapped to `docsearch()` props. */
export interface ClientSearchConfig {
  appId: string;
  apiKey: string;
  indices: Array<{ name: string; searchParameters?: Record<string, unknown> }>;
  placeholder?: string;
  maxResultsPerGroup?: number;
  disableUserPersonalization?: boolean;
  translations?: Record<string, unknown>;
}

/** Ask AI part of the browser config, mapped to `sidepanel()` props. */
export interface ClientAssistantConfig {
  agentId: string;
  appId: string;
  apiKey: string;
  indices?: string[];
  searchParameters?: Record<string, Record<string, unknown>>;
  panel: {
    variant?: "floating" | "inline";
    side?: "left" | "right";
    width?: number | string;
    expandedWidth?: number | string;
    suggestedQuestions?: boolean;
    translations?: Record<string, unknown>;
  };
}

/**
 * The JSON block flame reads (`#docubook-search-provider`). `module` and
 * `askAi` belong to flame's contract; the rest is this plugin's own.
 */
export interface ClientConfig {
  module: string;
  askAi: boolean;
  relativeUrls: boolean;
  search: ClientSearchConfig;
  assistant?: ClientAssistantConfig;
}

const PREFIX = "[plugin:search-algolia]";
const EXAMPLE =
  'Example: ["@docubook/plugin-search-algolia", { "appId": "YOUR_APP_ID", "apiKey": "YOUR_SEARCH_API_KEY", "indexName": "YOUR_INDEX_NAME" }]';

// Algolia application IDs are upper-case alphanumerics. The ID also becomes a
// host name (`<appId>-dsn.algolia.net`) in a preconnect hint, so nothing else
// may pass.
const APP_ID_RE = /^[A-Z0-9]+$/;

function fail(message: string): never {
  throw new Error(`${PREFIX} ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(source: Record<string, unknown>, key: string, where = ""): string {
  const value = source[key];
  if (typeof value !== "string" || value.trim() === "") {
    fail(`\`${where}${key}\` is required and must be a non-empty string. ${EXAMPLE}`);
  }
  return value.trim();
}

function optionalString(source: Record<string, unknown>, key: string, where = "") {
  const value = source[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    fail(`\`${where}${key}\` must be a non-empty string when set.`);
  }
  return value.trim();
}

function optionalBoolean(source: Record<string, unknown>, key: string, where = "") {
  const value = source[key];
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") fail(`\`${where}${key}\` must be true or false.`);
  return value;
}

function optionalRecord(source: Record<string, unknown>, key: string, where = "") {
  const value = source[key];
  if (value === undefined) return undefined;
  if (!isRecord(value)) fail(`\`${where}${key}\` must be an object.`);
  return value;
}

function optionalWidth(source: Record<string, unknown>, key: string, where = "") {
  const value = source[key];
  if (value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  fail(`\`${where}${key}\` must be a positive number of pixels or a CSS width.`);
}

function checkAppId<T extends string | undefined>(value: T, where = ""): T {
  if (value !== undefined && !APP_ID_RE.test(value)) {
    fail(`\`${where}appId\` must be an Algolia application ID (upper-case letters and digits).`);
  }
  return value;
}

function resolveAskAi(
  raw: unknown,
  search: { appId: string; apiKey: string; indexName: string }
): ClientAssistantConfig | undefined {
  if (raw === undefined || raw === false) return undefined;
  if (typeof raw === "string") {
    if (raw.trim() === "") fail("`askAi` must be an agent ID or an options object.");
    return {
      agentId: raw.trim(),
      appId: search.appId,
      apiKey: search.apiKey,
      indices: [search.indexName],
      panel: {},
    };
  }
  if (!isRecord(raw)) fail("`askAi` must be an agent ID or an options object.");

  const where = "askAi.";
  const variant = raw.variant;
  if (variant !== undefined && variant !== "floating" && variant !== "inline") {
    fail('`askAi.variant` must be "floating" or "inline".');
  }
  const side = raw.side;
  if (side !== undefined && side !== "left" && side !== "right") {
    fail('`askAi.side` must be "left" or "right".');
  }
  const indices = raw.indices;
  if (
    indices !== undefined &&
    (!Array.isArray(indices) ||
      indices.length === 0 ||
      indices.some((name) => typeof name !== "string" || name.trim() === ""))
  ) {
    fail("`askAi.indices` must be a non-empty list of index names.");
  }
  const searchParameters = optionalRecord(raw, "searchParameters", where);
  if (searchParameters && Object.values(searchParameters).some((value) => !isRecord(value))) {
    fail("`askAi.searchParameters` must map index names to search parameter objects.");
  }

  return {
    agentId: requireString(raw, "agentId", where),
    appId: checkAppId(optionalString(raw, "appId", where), where) ?? search.appId,
    apiKey: optionalString(raw, "apiKey", where) ?? search.apiKey,
    indices: (indices as string[] | undefined)?.map((name) => name.trim()) ?? [search.indexName],
    ...(searchParameters
      ? { searchParameters: searchParameters as Record<string, Record<string, unknown>> }
      : {}),
    panel: dropUndefined({
      variant: variant as "floating" | "inline" | undefined,
      side: side as "left" | "right" | undefined,
      width: optionalWidth(raw, "width", where),
      expandedWidth: optionalWidth(raw, "expandedWidth", where),
      suggestedQuestions: optionalBoolean(raw, "suggestedQuestions", where),
      translations: optionalRecord(raw, "translations", where),
    }),
  };
}

function dropUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

/**
 * Validate `docu.json` options and build the browser config. Throws a
 * `[plugin:search-algolia]` error naming the first problem, so a typo fails
 * the build instead of shipping a broken search box.
 */
export function resolveOptions(raw: unknown, module: string): ClientConfig {
  if (!isRecord(raw)) {
    fail(`options are required. ${EXAMPLE}`);
  }

  const search = {
    appId: checkAppId(requireString(raw, "appId")),
    apiKey: requireString(raw, "apiKey"),
    indexName: requireString(raw, "indexName"),
  };

  const maxResultsPerGroup = raw.maxResultsPerGroup;
  if (
    maxResultsPerGroup !== undefined &&
    (typeof maxResultsPerGroup !== "number" ||
      !Number.isInteger(maxResultsPerGroup) ||
      maxResultsPerGroup < 1)
  ) {
    fail("`maxResultsPerGroup` must be a positive integer.");
  }
  const searchParameters = optionalRecord(raw, "searchParameters");
  const assistant = resolveAskAi(raw.askAi, search);

  return {
    module,
    askAi: assistant !== undefined,
    relativeUrls: optionalBoolean(raw, "relativeUrls") ?? true,
    search: dropUndefined({
      appId: search.appId,
      apiKey: search.apiKey,
      indices: [
        searchParameters
          ? { name: search.indexName, searchParameters }
          : { name: search.indexName },
      ],
      placeholder: optionalString(raw, "placeholder"),
      maxResultsPerGroup: maxResultsPerGroup as number | undefined,
      disableUserPersonalization: optionalBoolean(raw, "disableUserPersonalization"),
      translations: optionalRecord(raw, "translations"),
    }),
    ...(assistant ? { assistant } : {}),
  };
}

/**
 * Serialize JSON for an inline `<script type="application/json">`. `<` is
 * escaped so a value containing `</script>` cannot end the block, and `&`,
 * `>` and the JavaScript line separators for good measure. `JSON.parse` turns
 * the escapes back into the original characters.
 */
export function serializeForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
