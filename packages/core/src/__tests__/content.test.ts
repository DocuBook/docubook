import { describe, it, expect } from "vitest";
import { z } from "zod";
import path from "node:path";
import {
  readMdxFileBySlug,
  parseMdxFile,
  compileParsedMdxFile,
  createMdxContentService,
} from "../content";

const FIXTURES_ROOT = path.resolve(__dirname, "__fixtures__");

describe("readMdxFileBySlug", () => {
  it("reads flat slug (getting-started.mdx)", async () => {
    const result = await readMdxFileBySlug("getting-started", {
      rootDir: FIXTURES_ROOT,
    });
    expect(result.content).toContain("title: Getting Started");
    expect(result.filePath).toBe("docs/getting-started.mdx");
  });

  it("reads nested slug via index.mdx (guide/index.mdx)", async () => {
    const result = await readMdxFileBySlug("guide", {
      rootDir: FIXTURES_ROOT,
    });
    expect(result.content).toContain("title: Guide Overview");
    expect(result.filePath).toBe("docs/guide/index.mdx");
  });

  it("reads root slug as index.mdx", async () => {
    const result = await readMdxFileBySlug("", {
      rootDir: FIXTURES_ROOT,
    });
    expect(result.content).toContain("title: Home");
    expect(result.filePath).toBe("docs/index.mdx");
  });

  it("throws on non-existent slug", async () => {
    await expect(readMdxFileBySlug("does-not-exist", { rootDir: FIXTURES_ROOT })).rejects.toThrow(
      "Could not find mdx file"
    );
  });

  it("rejects path traversal attempts", async () => {
    await expect(readMdxFileBySlug("../../etc/passwd", { rootDir: FIXTURES_ROOT })).rejects.toThrow(
      "Could not find mdx file"
    );
  });
});

describe("parseMdxFile", () => {
  it("extracts frontmatter and tocs", async () => {
    const raw = await readMdxFileBySlug("getting-started", {
      rootDir: FIXTURES_ROOT,
    });
    const parsed = parseMdxFile<{ title: string; description: string }>(raw);
    expect(parsed.frontmatter.title).toBe("Getting Started");
    expect(parsed.frontmatter.description).toBe("Quick start guide");
    expect(parsed.tocs.length).toBeGreaterThan(0);
    expect(parsed.tocs[0].text).toBe("Installation");
    expect(parsed.tocs[0].href).toBe("#installation");
  });

  it("strips frontmatter from content", async () => {
    const raw = await readMdxFileBySlug("getting-started", {
      rootDir: FIXTURES_ROOT,
    });
    const parsed = parseMdxFile<{ title: string }>(raw);
    expect(parsed.content).not.toContain("---");
    expect(parsed.content).toContain("## Installation");
  });

  it("supports custom tocsExtractor", async () => {
    const raw = await readMdxFileBySlug("getting-started", {
      rootDir: FIXTURES_ROOT,
    });
    const parsed = parseMdxFile(raw, {
      tocsExtractor: () => [{ level: 1, text: "Custom", href: "#custom" }],
    });
    expect(parsed.tocs).toEqual([{ level: 1, text: "Custom", href: "#custom" }]);
  });
});

describe("compileParsedMdxFile", () => {
  it("compiles parsed MDX to React content", async () => {
    const raw = await readMdxFileBySlug("getting-started", {
      rootDir: FIXTURES_ROOT,
    });
    const parsed = parseMdxFile<{ title: string }>(raw);
    const compiled = await compileParsedMdxFile(parsed);
    expect(compiled.content).toBeDefined();
    expect(compiled.frontmatter.title).toBe("Getting Started");
    expect(compiled.tocs.length).toBeGreaterThan(0);
    expect(compiled.filePath).toBe("docs/getting-started.mdx");
  });
});

describe("createMdxContentService", () => {
  const service = createMdxContentService<{ title: string; description: string }>({
    readOptions: { rootDir: FIXTURES_ROOT },
  });

  it("getParsedForSlug returns parsed data", async () => {
    const parsed = await service.getParsedForSlug("getting-started");
    expect(parsed.frontmatter.title).toBe("Getting Started");
    expect(parsed.tocs.length).toBeGreaterThan(0);
  });

  it("getFrontmatterForSlug returns frontmatter only", async () => {
    const fm = await service.getFrontmatterForSlug("guide");
    expect(fm.title).toBe("Guide Overview");
  });

  it("getTocsForSlug returns tocs only", async () => {
    const tocs = await service.getTocsForSlug("getting-started");
    expect(tocs[0].text).toBe("Installation");
    expect(tocs[1].text).toBe("Usage");
  });

  it("getCompiledForSlug returns compiled result", async () => {
    const compiled = await service.getCompiledForSlug("getting-started");
    expect(compiled.content).toBeDefined();
    expect(compiled.frontmatter.title).toBe("Getting Started");
  });

  it("supports frontmatterEnricher", async () => {
    const enrichedService = createMdxContentService<{ title: string; enriched: boolean }>({
      readOptions: { rootDir: FIXTURES_ROOT },
      frontmatterEnricher: (fm) => ({ ...fm, enriched: true }),
    });
    const parsed = await enrichedService.getParsedForSlug("getting-started");
    expect(parsed.frontmatter.enriched).toBe(true);
  });

  it("validates frontmatter with zod schema", async () => {
    const schema = z.object({
      title: z.coerce.string().min(1),
      description: z.coerce.string().default(""),
      date: z.coerce.string().optional(),
    });
    const service = createMdxContentService<z.infer<typeof schema>>({
      readOptions: { rootDir: FIXTURES_ROOT },
      frontmatterSchema: schema,
    });
    const parsed = await service.getParsedForSlug("getting-started");
    expect(parsed.frontmatter.title).toBe("Getting Started");
    expect(typeof parsed.frontmatter.description).toBe("string");
  });

  it("throws on frontmatter that fails schema validation", async () => {
    const schema = z.object({
      title: z.coerce.string().min(1),
      requiredField: z.string(), // missing in fixture
    });
    const service = createMdxContentService<z.infer<typeof schema>>({
      readOptions: { rootDir: FIXTURES_ROOT },
      frontmatterSchema: schema,
    });
    await expect(service.getParsedForSlug("getting-started")).rejects.toThrow();
  });

  it("coerces unquoted YAML values to strings", async () => {
    const schema = z.object({
      title: z.coerce.string(),
      version: z.coerce.string().optional(),
    });
    // Simulate YAML coercion: `3.5` parses as number, `2026-06-10` as Date
    const frontmatter = { title: "Intro", version: 3.5 } as unknown;
    const result = schema.parse(frontmatter);
    expect(result.version).toBe("3.5");
  });
});
