import { describe, it, expect, beforeEach } from "vitest";
import {
  compileMdxModule,
  compileMdx,
  frontmatterSchema,
  getPageFrontmatter,
  getPageStripped,
  getPageContent,
  registerPageContent,
} from "../node/mdx";
import { getPreviousNext } from "../node/route";

const MDX = `---
title: Test Page
description: A test description
author: wildan
date: 2026-08-15
---

# Heading

Content here.
`;

// Distinct hrefs per test — the registries are module-level Maps.
let seq = 0;
const href = () => `/parse-once/${++seq}-${Date.now()}`;

describe("frontmatter parse-once registry (mdx.ts)", () => {
  it("compileMdxModule registers the full frontmatter + stripped content", async () => {
    const h = href();
    await compileMdxModule(MDX, [], [], h);

    const fm = getPageFrontmatter(h);
    expect(fm?.title).toBe("Test Page");
    expect(fm?.description).toBe("A test description");
    expect(fm?.date).toBe("2026-08-15");
    // passthrough: unknown fields survive zod parsing
    expect(fm?.author).toBe("wildan");

    const stripped = getPageStripped(h);
    expect(stripped).not.toContain("---");
    expect(stripped).toContain("# Heading");
  });

  it("frontmatterSchema passthrough keeps arbitrary fields", () => {
    const parsed = frontmatterSchema.parse({
      title: "T",
      description: "D",
      author: "wildan",
      tags: ["docs", "v2"],
      views: 42,
    });
    expect(parsed.author).toBe("wildan");
    expect(parsed.tags).toEqual(["docs", "v2"]);
    expect(parsed.views).toBe(42);
  });

  it("registerPageContent / getPageContent round-trip (read-once)", () => {
    const h = href();
    registerPageContent(h, "raw content");
    expect(getPageContent(h)).toBe("raw content");
  });

  it("compileMdx with pre skips its own frontmatter extraction", async () => {
    const h = href();
    const pre = { frontmatter: { title: "Pre Title" }, strippedContent: "# Heading\nContent" };
    const result = await compileMdx(
      "# Heading\nContent",
      "test.mdx",
      undefined,
      [],
      [],
      undefined,
      pre
    );
    expect(result.frontmatter.title).toBe("Pre Title");
    expect(result.frontmatter.author).toBeUndefined(); // pre data used, not the source
    expect(getPageFrontmatter(h)).toBeUndefined(); // compileMdx alone does not register
  });
});

describe("getPreviousNext reads the registry, not the file (route.ts)", () => {
  beforeEach(() => {
    // register a synthetic "formatting" page so the pagination for
    // configuration (whose next page is formatting per docu.json routes)
    // resolves from the registry instead of reading the real file.
    registerPageContent("/getting-started/formatting", "raw");
    return compileMdxModule(
      `---\ntitle: Formatting Override\ndescription: REGISTERED DESC\n---\n# Formatting\n`,
      [],
      [],
      "/getting-started/formatting"
    );
  });

  it("next title + description come from the registered frontmatter", () => {
    const { next } = getPreviousNext("/getting-started/configuration");
    expect(next?.title).toBe("Formatting Override");
    expect(next?.description).toBe("REGISTERED DESC");
  });
});
