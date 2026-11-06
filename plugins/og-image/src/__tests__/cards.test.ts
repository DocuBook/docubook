import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DocuConfig } from "@docubook/flame";
import { docsCard, homeCard, imageRef, planCard, readFrontmatter, skipReason } from "../cards";
import { resolveOptions } from "../options";
import { resolveSite } from "../site";

const config = {
  meta: { title: "Acme Docs", description: "Docs for Acme.", baseURL: "https://acme.dev" },
  navbar: { logoText: "Acme" },
  routes: [{ title: "Guides", href: "/guides" }],
  home: { hero: { headline: "Ship docs fast." } },
} as unknown as DocuConfig;
const options = resolveOptions({});
const site = resolveSite(config, options, "/project");

describe("skipReason", () => {
  it("lets an author's image win and honours og: false", () => {
    expect(skipReason("docs", { title: "A" }, options)).toBeUndefined();
    expect(skipReason("docs", { image: "./assets/me.png" }, options)).toBe("author-image");
    expect(skipReason("docs", { image: "  " }, options)).toBeUndefined();
    expect(skipReason("docs", { og: false }, options)).toBe("opt-out");
    expect(skipReason("index", {}, resolveOptions({ pages: { index: false } }))).toBe("disabled");
  });
});

describe("docsCard", () => {
  it("uses frontmatter title, description and the route section", () => {
    expect(
      docsCard("docs", "guides/setup", { title: " Setup ", description: "Install it." }, site)
    ).toEqual({
      kind: "docs",
      slug: "guides/setup",
      title: "Setup",
      description: "Install it.",
      section: "Guides",
    });
  });

  it("falls back like flame and coerces YAML scalars", () => {
    expect(docsCard("docs", "guides/setup", {}, site).title).toBe("guides/setup");
    expect(docsCard("index", "", {}, site).title).toBe("Docs");
    expect(docsCard("docs", "x", { title: 2026, description: true }, site)).toMatchObject({
      title: "2026",
      description: "true",
    });
  });

  it("applies og overrides to the card only", () => {
    const card = docsCard(
      "docs",
      "a",
      { title: "Long page title", og: { title: "Short", description: "Card text" } },
      site
    );
    expect(card).toMatchObject({ title: "Short", description: "Card text" });
  });
});

describe("homeCard", () => {
  it("uses the hero headline and the site description", () => {
    expect(homeCard(config)).toEqual({
      kind: "home",
      slug: "",
      title: "Ship docs fast.",
      description: "Docs for Acme.",
      section: undefined,
    });
  });
});

describe("planCard", () => {
  const card = docsCard("docs", "guides/setup", { title: "Setup" }, site);

  it("names the file after the slug and a stable hash", () => {
    const planned = planCard(card, site, options, "1.0.0");
    expect(planned.file).toMatch(/^guides\/setup\.[0-9a-f]{8}\.png$/);
    expect(planCard(card, site, options, "1.0.0").file).toBe(planned.file);
    expect(imageRef(planned.file)).toBe(`./assets/og/${planned.file}`);
  });

  it("changes the name when text, layout or plugin version change", () => {
    const base = planCard(card, site, options, "1.0.0").file;
    expect(planCard({ ...card, title: "Setup 2" }, site, options, "1.0.0").file).not.toBe(base);
    expect(planCard(card, site, resolveOptions({ layout: "minimal" }), "1.0.0").file).not.toBe(
      base
    );
    expect(planCard(card, site, options, "1.0.1").file).not.toBe(base);
  });

  it("keeps special pages apart from docs slugs of the same name", () => {
    const index = planCard(docsCard("index", "", { title: "Home" }, site), site, options, "1");
    const docsIndex = planCard(
      docsCard("docs", "index", { title: "Home" }, site),
      site,
      options,
      "1"
    );
    expect(index.file.split(".")[0]).toBe("index");
    expect(index.file).not.toBe(docsIndex.file);
    expect(planCard(homeCard(config), site, options, "1").file).toMatch(/^home\.[0-9a-f]{8}\.png$/);
  });
});

describe("readFrontmatter", () => {
  let docs: string;
  beforeAll(async () => {
    docs = await mkdtemp(join(tmpdir(), "og-cards-"));
    await mkdir(join(docs, "guide/nested"), { recursive: true });
    await writeFile(join(docs, "index.md"), "---\ntitle: Welcome\n---\n");
    await writeFile(
      join(docs, "guide/setup.mdx"),
      "---\ntitle: Setup\nog:\n  title: Short\n---\n# Setup"
    );
    await writeFile(join(docs, "guide/nested/index.mdx"), "---\ntitle: Nested\n---\n");
    await writeFile(join(docs, "plain.md"), "# No frontmatter");
  });
  afterAll(() => rm(docs, { recursive: true, force: true }));

  it("finds the source file the way flame's scanner names slugs", async () => {
    expect(await readFrontmatter(docs, "")).toEqual({ title: "Welcome" });
    expect(await readFrontmatter(docs, "guide/setup")).toEqual({
      title: "Setup",
      og: { title: "Short" },
    });
    expect(await readFrontmatter(docs, "guide/nested")).toEqual({ title: "Nested" });
    expect(await readFrontmatter(docs, "plain")).toEqual({});
    expect(await readFrontmatter(docs, "missing")).toBeUndefined();
  });
});
