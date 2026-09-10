import { describe, expect, it } from "vitest";
import { createMdxModuleEntries } from "../node/hydrate";
import { viteChunkFileName } from "../node/hydrate.node";

describe("createMdxModuleEntries", () => {
  it("maps sorted slugs to stable URL-safe virtual module IDs", () => {
    const entries = createMdxModuleEntries({
      "getting-started/introduction": "nested",
      "symbols/% and ünicode": "encoded",
      "": "index",
    });

    expect(entries).toEqual([
      { slug: "", id: "docubook-mdx-page-e3b0c44298fc1c14" },
      {
        slug: "getting-started/introduction",
        id: "docubook-mdx-page-41f718ecb92c9fb0",
      },
      { slug: "symbols/% and ünicode", id: "docubook-mdx-page-c051506a4ac4524b" },
    ]);

    expect(
      createMdxModuleEntries({
        "aaa/new-route": "new",
        "getting-started/introduction": "changed",
      }).find(({ slug }) => slug === "getting-started/introduction")?.id
    ).toBe(entries[1]?.id);
  });

  it("normalizes Vite virtual MDX chunks to Bun-compatible names", () => {
    expect(viteChunkFileName({ name: "_docubook-mdx-page-41f718ecb92c9fb0" })).toBe(
      "chunks/docubook-mdx-page-41f718ecb92c9fb0-[hash].js"
    );
    expect(viteChunkFileName({ name: "mermaid" })).toBe("chunks/mermaid-[hash].js");
  });
});
