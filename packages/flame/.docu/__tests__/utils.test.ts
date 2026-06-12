import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("getGitLastModifiedBatch", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  function mockSpawnOutput(stdout: string) {
    vi.spyOn(globalThis.Bun, "spawn").mockReturnValue({
      stdout: new Response(stdout).body!,
    } as ReturnType<typeof Bun.spawn>);
  }

  it("returns empty map for empty input", async () => {
    const result = await getGitLastModifiedBatch([]);
    expect(result).toEqual(new Map());
  });

  it("parses git log output with dates and filenames", async () => {
    mockSpawnOutput(
      "2024-05-20T10:00:00+07:00\n\ndocs/intro.mdx\n\n2024-05-19T09:00:00+07:00\n\ndocs/guide.mdx\n"
    );

    const result = await getGitLastModifiedBatch(["docs/intro.mdx", "docs/guide.mdx"]);
    expect(result.get("docs/intro.mdx")).toBe("2024-05-20T10:00:00+07:00");
    expect(result.get("docs/guide.mdx")).toBe("2024-05-19T09:00:00+07:00");
  });

  it("keeps first (most recent) date for duplicate files", async () => {
    mockSpawnOutput(
      "2024-05-20T10:00:00+07:00\n\ndocs/intro.mdx\n\n2024-05-18T08:00:00+07:00\n\ndocs/intro.mdx\n"
    );

    const result = await getGitLastModifiedBatch(["docs/intro.mdx"]);
    expect(result.get("docs/intro.mdx")).toBe("2024-05-20T10:00:00+07:00");
  });

  it("returns empty map when spawn throws", async () => {
    vi.spyOn(globalThis.Bun, "spawn").mockImplementation(() => {
      throw new Error("git not found");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getGitLastModifiedBatch(["docs/intro.mdx"]);
    expect(result).toEqual(new Map());
  });

  describe("path validation", () => {
    it("filters out paths with directory traversal", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = await getGitLastModifiedBatch([
        "docs/safe.mdx",
        "../../etc/passwd",
        "docs/../secret.md",
      ]);
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy.mock.calls[0][0]).toContain("../../etc/passwd");
      expect(warnSpy.mock.calls[1][0]).toContain("../secret.md");
      // Valid path "docs/safe.mdx" passes filter, but spawn not mocked → empty map
      expect(result.size).toBe(0);
      warnSpy.mockRestore();
    });

    it("returns empty map when all paths are invalid", async () => {
      const spawnSpy = vi.spyOn(globalThis.Bun, "spawn");
      const result = await getGitLastModifiedBatch(["../../etc/passwd", "/../secret.md"]);
      expect(result).toEqual(new Map());
      expect(spawnSpy).not.toHaveBeenCalled();
    });

    it("allows normal docs paths through without warning", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      await getGitLastModifiedBatch(["docs/intro.mdx", "getting-started.md"]);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});

// Import after mock setup
import { getGitLastModifiedBatch, scanMdxFiles } from "../node/utils";

describe("scanMdxFiles", () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "flame-scan-test-"));

    // docs/
    // ├── index.mdx        (root-level → skipped)
    // ├── getting-started/
    // │   ├── index.mdx    → slug: "getting-started"
    // │   └── intro.mdx    → slug: "getting-started/intro"
    // ├── guides/
    // │   └── advanced/
    // │       └── deep.mdx → slug: "guides/advanced/deep"
    // └── reference.md     → slug: "reference"
    // docs/assets/          → should be skipped

    writeFileSync(join(tmpDir, "index.mdx"), "# Root");

    mkdirSync(join(tmpDir, "getting-started"), { recursive: true });
    writeFileSync(join(tmpDir, "getting-started", "index.mdx"), "# Getting Started");
    writeFileSync(join(tmpDir, "getting-started", "intro.mdx"), "# Intro");

    mkdirSync(join(tmpDir, "guides", "advanced"), { recursive: true });
    writeFileSync(join(tmpDir, "guides", "advanced", "deep.mdx"), "# Deep");

    writeFileSync(join(tmpDir, "reference.md"), "# Reference");

    mkdirSync(join(tmpDir, "assets"), { recursive: true });
    writeFileSync(join(tmpDir, "assets", "logo.svg"), "<svg></svg>");
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns all MDX/MD files excluding root index.mdx and assets/", async () => {
    const files = await scanMdxFiles(tmpDir);

    expect(files).toHaveLength(4);

    const slugs = files.map((f) => f.path);
    expect(slugs).toContain("getting-started");
    expect(slugs).toContain("getting-started/intro");
    expect(slugs).toContain("guides/advanced/deep");
    expect(slugs).toContain("reference");
  });

  it("returns absPath as absolute paths", async () => {
    const files = await scanMdxFiles(tmpDir);

    for (const file of files) {
      expect(file.absPath).toBeDefined();
      expect(file.absPath).toContain(tmpDir);
      expect(file.absPath).toMatch(/\.(mdx|md)$/);
    }
  });

  it("returns positive mtime for all files", async () => {
    const files = await scanMdxFiles(tmpDir);

    for (const file of files) {
      expect(file.mtime).toBeGreaterThan(0);
    }
  });

  it("returns empty array for directory with no MDX files", async () => {
    const emptyDir = mkdtempSync(join(tmpdir(), "flame-scan-empty-"));
    const files = await scanMdxFiles(emptyDir);
    expect(files).toEqual([]);
    rmSync(emptyDir, { recursive: true, force: true });
  });

  it("skips hidden directories", async () => {
    mkdirSync(join(tmpDir, ".hidden"), { recursive: true });
    writeFileSync(join(tmpDir, ".hidden", "secret.mdx"), "# secret");

    const files = await scanMdxFiles(tmpDir);
    const slugs = files.map((f) => f.path);
    expect(slugs).not.toContain(".hidden/secret");
  });
});
