import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fsMocks = vi.hoisted(() => ({
  readdir: vi.fn(async () => [] as string[]),
  rm: vi.fn(async () => undefined),
  unlink: vi.fn(async () => undefined),
}));

vi.mock("node:fs/promises", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:fs/promises")>()),
  ...fsMocks,
}));

import { createMdxModuleEntries } from "../node/hydrate";
import { viteChunkFileName } from "../node/hydrate.node";
import { ASSETS_DIR, cleanOldBundles } from "../node/paths";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("cleanOldBundles", () => {
  it("removes stale entry assets and the generated chunk directory", async () => {
    fsMocks.readdir.mockResolvedValue([
      "client-old.js",
      "home-client.old.js",
      "docs-old.css",
      "site.old.css",
      "manifest.json",
      "favicon.ico",
      "chunks",
    ]);

    await cleanOldBundles();

    expect(fsMocks.unlink.mock.calls).toEqual([
      [join(ASSETS_DIR, "client-old.js")],
      [join(ASSETS_DIR, "home-client.old.js")],
      [join(ASSETS_DIR, "docs-old.css")],
      [join(ASSETS_DIR, "site.old.css")],
    ]);
    expect(fsMocks.rm).toHaveBeenCalledOnce();
    expect(fsMocks.rm).toHaveBeenCalledWith(join(ASSETS_DIR, "chunks"), {
      recursive: true,
      force: true,
    });
  });
});

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
