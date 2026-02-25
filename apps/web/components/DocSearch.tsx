"use client";

import React from "react";
import { DocSearch } from "@docsearch/react";

export default function DocSearchComponent() {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_DOCSEARCH_APP_ID;
  const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_DOCSEARCH_API_KEY;
  const indexName = process.env.NEXT_PUBLIC_ALGOLIA_DOCSEARCH_INDEX_NAME;

  if (!appId || !apiKey || !indexName) {
    console.error(
      "DocSearch credentials are not set in the environment variables."
    );
    return (
      <button className="text-sm text-muted-foreground" disabled>
        Search... (misconfigured)
      </button>
    );
  }

  return (
    <div className="docsearch">
      <DocSearch
        appId={appId}
        apiKey={apiKey}
        indexName={indexName}
        placeholder="Type something to search..."
      />
    </div>
  );
}