import { describe, expect, it } from "vitest";
import { search } from "../node/search";
import type { SearchRecord } from "../node/search-indexer";

function record(url: string, title: string, content: string | null = null): SearchRecord {
  return {
    url,
    hierarchy: {
      lvl0: "Docs",
      lvl1: title,
      lvl2: null,
      lvl3: null,
      lvl4: null,
      lvl5: null,
      lvl6: null,
    },
    content,
    type: "lvl1",
  };
}

describe("search", () => {
  it("ranks a short query prefix above unrelated exact occurrences", () => {
    const results = search("seq", [
      record("/docs/sequence.html", "Sequence Diagram"),
      record("/docs/other.html", "Other Guide", "Use the seq option here."),
    ]);

    expect(results[0]?.url).toBe("/docs/sequence.html");
  });

  it("keeps typo tolerance for short queries", () => {
    const results = search("seu", [record("/docs/sequence.html", "Sequence Diagram")]);

    expect(results[0]?.url).toBe("/docs/sequence.html");
  });
});
