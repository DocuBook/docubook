import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { scanDocsFolder } from "../node/fs-scanner";

const TMP_DOCS = join(process.cwd(), ".tmp-test-docs");

function createFile(relPath: string, content = "---\ntitle: Test\n---\n# Hello") {
  const full = join(TMP_DOCS, relPath);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, content);
}

describe("fs-scanner", () => {
  beforeAll(() => {
    mkdirSync(TMP_DOCS, { recursive: true });
    // Structure:
    // .tmp-test-docs/
    //   index.mdx
    //   guide/
    //     components.mdx
    //     advanced.mdx
    //   getting-started/
    //     index.mdx        (makes it linkable)
    //     introduction.mdx
    //     search/
    //       index.mdx
    //       built-in.mdx
    //       algolia.mdx
    createFile("index.mdx");
    createFile("guide/components.mdx");
    createFile("guide/advanced.mdx");
    createFile("getting-started/index.mdx");
    createFile("getting-started/introduction.mdx");
    createFile("getting-started/search/index.mdx");
    createFile("getting-started/search/built-in.mdx");
    createFile("getting-started/search/algolia.mdx");
  });

  afterAll(() => {
    rmSync(TMP_DOCS, { recursive: true, force: true });
  });

  it("generates relative href for child items (no path duplication)", () => {
    const routes = scanDocsFolder(".tmp-test-docs");

    const guide = routes.find((r) => r.title === "Guide");
    expect(guide).toBeDefined();
    expect(guide!.href).toBe("/guide");
    expect(guide!.noLink).toBe(true);

    // Children must have relative href (just /{segment})
    const components = guide!.items!.find((r) => r.title === "Components");
    expect(components).toBeDefined();
    expect(components!.href).toBe("/components");

    const advanced = guide!.items!.find((r) => r.title === "Advanced");
    expect(advanced!.href).toBe("/advanced");
  });

  it("marks directory with index file as linkable (no noLink)", () => {
    const routes = scanDocsFolder(".tmp-test-docs");

    const gettingStarted = routes.find((r) => r.title === "Getting Started");
    expect(gettingStarted).toBeDefined();
    expect(gettingStarted!.href).toBe("/getting-started");
    expect(gettingStarted!.noLink).toBeUndefined();
  });

  it("handles nested directories with relative hrefs", () => {
    const routes = scanDocsFolder(".tmp-test-docs");

    const gettingStarted = routes.find((r) => r.title === "Getting Started");
    const search = gettingStarted!.items!.find((r) => r.title === "Search");
    expect(search).toBeDefined();
    expect(search!.href).toBe("/search");
    expect(search!.noLink).toBeUndefined(); // has index.mdx

    const builtIn = search!.items!.find((r) => r.title === "Built In");
    expect(builtIn!.href).toBe("/built-in");

    const algolia = search!.items!.find((r) => r.title === "Algolia");
    expect(algolia!.href).toBe("/algolia");
  });

  it("skips index/readme files from route items", () => {
    const routes = scanDocsFolder(".tmp-test-docs");

    const gettingStarted = routes.find((r) => r.title === "Getting Started");
    const indexItem = gettingStarted!.items!.find((r) => r.title === "Index");
    expect(indexItem).toBeUndefined();
  });

  it("adds context only to top-level routes", () => {
    const routes = scanDocsFolder(".tmp-test-docs");

    const guide = routes.find((r) => r.title === "Guide");
    expect(guide!.context).toBeDefined();

    // Nested dir should NOT have context
    const gettingStarted = routes.find((r) => r.title === "Getting Started");
    const search = gettingStarted!.items!.find((r) => r.title === "Search");
    expect(search!.context).toBeUndefined();
  });

  it("returns empty array for non-existent docs folder", () => {
    const routes = scanDocsFolder(".non-existent-folder");
    expect(routes).toEqual([]);
  });
});
