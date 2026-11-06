# @docubook/plugin-search-algolia

[Algolia DocSearch](https://docsearch.algolia.com/) v5 for [DocuBook Flame](https://github.com/DocuBook/docubook/tree/main/packages/flame).

- **Search** opens the DocSearch dialog with keyword results only, from Flame's sidebar search bar, the mobile search icon, or `⌘ K` / `Ctrl K`.
- **Ask AI** (optional) opens the DocSearch side panel, a separate surface, from a Sparkles button beside the sidebar search bar, an **Ask AI** row in the mobile menu drawer, or `⌘ I` / `Ctrl I`.

The dialog and panel use your Flame theme colors and follow the light/dark toggle. DocSearch is served from your own domain and downloaded only when a reader first reaches for search.

## Install

```bash
npm install -D @docubook/plugin-search-algolia
```

```json
{
  "plugins": [
    ["@docubook/plugin-search-algolia", {
      "appId": "YOUR_APP_ID",
      "apiKey": "YOUR_SEARCH_ONLY_API_KEY",
      "indexName": "YOUR_INDEX_NAME",
      "askAi": "YOUR_AGENT_ID"
    }]
  ]
}
```

Leave out `askAi` for search only. Use a **search-only** API key, never the Admin key.

## Options

| Option | Type | Description |
| --- | --- | --- |
| `appId` | string | **Required.** Algolia application ID. |
| `apiKey` | string | **Required.** Search-only API key. |
| `indexName` | string | **Required.** Index the crawler writes to. |
| `askAi` | string \| object | Agent Studio agent ID, or `{ agentId, appId?, apiKey?, indices?, searchParameters?, suggestedQuestions?, variant?, side?, width?, expandedWidth?, translations? }`. |
| `searchParameters` | object | Algolia search parameters for the dialog. |
| `placeholder` | string | Search input placeholder. |
| `maxResultsPerGroup` | number | Maximum results per group. |
| `disableUserPersonalization` | boolean | Do not store recent and favorite searches. |
| `translations` | object | DocSearch modal translations. |
| `relativeUrls` | boolean | Default `true`: open results on the current origin rather than the crawled one. |

Full guide, including the crawler configuration: [Algolia search](https://docs.docubook.pro/docs/getting-started/search/algolia).

## How it works

The plugin declares a search provider on docs pages (see [Search providers](https://docs.docubook.pro/docs/getting-started/plugins#search-providers)) and copies its browser build into Flame's bundle directory (`assets/docsearch/`). Flame keeps rendering the search bar and buttons and imports `docsearch/client.js` on first use. That module mounts `@docsearch/js/docsearch` (the keyword-only entry) and `@docsearch/sidepanel-js`, each loaded when first opened, with DocSearch's own buttons and shortcuts turned off.

Requires `@docubook/flame` with search provider support (`DevServerContext.assetsPath`).

## Development

```bash
pnpm --filter @docubook/plugin-search-algolia build   # dist/index.js + dist/client/
pnpm --filter @docubook/plugin-search-algolia test
```
