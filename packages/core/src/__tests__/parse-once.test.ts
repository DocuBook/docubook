import { describe, it, expect } from "vitest";
import { z } from "zod";
import { extractFrontmatterWithContent } from "../extract";
import { serialize } from "../compile";

describe("no double parsing", () => {
  it("gray-matter called once, serialize does not re-parse", async () => {
    // 1. extract once
    const raw = `---\ntitle: Intro\nversion: 3.5\n---\n\n## Hello`;
    const { frontmatter, strippedContent } =
      extractFrontmatterWithContent<Record<string, unknown>>(raw);
    expect(frontmatter.title).toBe("Intro");
    expect(strippedContent).not.toContain("---");

    // 2. serialize with parseFrontmatter:false (default) — no re-parse
    // vfile.data.matter stays undefined → frontmatter {}
    const result = await serialize(strippedContent, {});
    expect(result.frontmatter).toEqual({});
    // stripped content compiles fine without frontmatter
    expect(result.compiledSource).toContain("Hello");
  });

  it("yaml coercion: unquoted version stays parseable", () => {
    const raw = `---\ntitle: Intro\nversion: 3.5\npriority: 5\n---\n\nbody`;
    const { frontmatter } = extractFrontmatterWithContent<Record<string, unknown>>(raw);
    expect(typeof frontmatter.version).toBe("number"); // YAML coercion
    expect(typeof frontmatter.priority).toBe("number");
  });
});

describe("nested frontmatter schema", () => {
  it("validates nested YAML objects with zod", () => {
    const raw = `---
title: Intro
author:
  name: Wildan
  email: wildan@dev.com
seo:
  ogImage: /img/og.png
  keywords: [docs, mdx]
---
body`;
    const schema = z.object({
      title: z.coerce.string(),
      author: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
      seo: z.object({
        ogImage: z.string(),
        keywords: z.array(z.string()),
      }),
    });
    const { frontmatter, strippedContent } = extractFrontmatterWithContent<z.infer<typeof schema>>(
      raw,
      schema
    );
    expect(frontmatter.author.name).toBe("Wildan");
    expect(frontmatter.author.email).toBe("wildan@dev.com");
    expect(frontmatter.seo.keywords).toEqual(["docs", "mdx"]);
    expect(strippedContent).not.toContain("author");
  });

  it("nested group missing in YAML fails unless optional", () => {
    const raw = `---\ntitle: NoAuthor\n---\nbody`;
    const strictSchema = z.object({
      title: z.coerce.string(),
      author: z.object({ name: z.string() }), // required
    });
    expect(() => extractFrontmatterWithContent(raw, strictSchema)).toThrow();

    const optionalSchema = z.object({
      title: z.coerce.string(),
      author: z.object({ name: z.string() }).optional(), // optional
    });
    const { frontmatter } = extractFrontmatterWithContent(raw, optionalSchema);
    expect(frontmatter.author).toBeUndefined();
  });
});
