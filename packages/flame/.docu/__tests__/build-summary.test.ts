import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  collectBuildOutput,
  formatBuildSummary,
  formatSize,
  generateBuildSummary,
} from "../node/build-summary";

const KB = 1024;

describe("build-summary", () => {
  let dist: string;

  beforeEach(async () => {
    dist = await mkdtemp(join(tmpdir(), "dist-"));
  });

  afterEach(async () => {
    await rm(dist, { recursive: true, force: true });
  });

  describe("formatSize", () => {
    it("formats bytes under 1 KB as B", () => {
      expect(formatSize(0)).toBe("0 B");
      expect(formatSize(512)).toBe("512 B");
      expect(formatSize(1023)).toBe("1023 B");
    });

    it("formats KiB with two decimals", () => {
      expect(formatSize(1024)).toBe("1.00 KB");
      expect(formatSize(256 * KB + 440)).toBe("256.43 KB");
    });

    it("formats MiB with two decimals", () => {
      expect(formatSize(1024 * KB)).toBe("1.00 MB");
    });
  });

  describe("collectBuildOutput", () => {
    it("returns null when the directory does not exist", async () => {
      expect(await collectBuildOutput(join(dist, "missing"))).toBeNull();
    });

    it("returns null for an empty directory", async () => {
      expect(await collectBuildOutput(dist)).toBeNull();
    });

    it("collects nested files with paths relative to dist", async () => {
      await mkdir(join(dist, "docs"), { recursive: true });
      await mkdir(join(dist, "assets"), { recursive: true });
      await writeFile(join(dist, "index.html"), "x".repeat(100));
      await writeFile(join(dist, "docs", "intro.html"), "y".repeat(200));
      await writeFile(join(dist, "assets", "client.js"), "z".repeat(300));

      const output = await collectBuildOutput(dist);
      expect(output).not.toBeNull();
      const paths = output!.files.map((f) => f.path).sort();
      expect(paths).toEqual(["assets/client.js", "docs/intro.html", "index.html"]);
    });

    it("totals files and sizes across types", async () => {
      await writeFile(join(dist, "a.html"), "a".repeat(10));
      await writeFile(join(dist, "b.html"), "b".repeat(20));
      await writeFile(join(dist, "c.js"), "c".repeat(30));

      const output = await collectBuildOutput(dist);
      expect(output!.totalFiles).toBe(3);
      expect(output!.totalSize).toBe(60);
      const html = output!.byType.find((t) => t.ext === ".html");
      expect(html).toEqual({ ext: ".html", count: 2, size: 30 });
      const js = output!.byType.find((t) => t.ext === ".js");
      expect(js).toEqual({ ext: ".js", count: 1, size: 30 });
    });

    it("groups extensionless files under (none)", async () => {
      await writeFile(join(dist, "README"), "x");
      const output = await collectBuildOutput(dist);
      expect(output!.byType[0].ext).toBe("(none)");
    });
  });

  describe("formatBuildSummary", () => {
    it("renders the header, file list, type table, and total", async () => {
      await mkdir(join(dist, "docs"), { recursive: true });
      await writeFile(join(dist, "index.html"), "x".repeat(100));
      await writeFile(join(dist, "docs", "intro.html"), "y".repeat(200));
      await writeFile(join(dist, "client.js"), "z".repeat(300));

      const output = (await collectBuildOutput(dist))!;
      const rendered = formatBuildSummary(output);

      expect(rendered).toContain("📦 Build Output Summary:");
      expect(rendered).toContain("📊 Summary by Type:");
      expect(rendered).toContain("📈 Total:");
      expect(rendered).toContain("client.js");
      expect(rendered).toContain(".html");
      expect(rendered).toContain(`📈 Total: 3 files`);
    });

    it("truncates the file list beyond the visible limit", async () => {
      for (let i = 0; i < 15; i++) {
        await writeFile(join(dist, `file-${i}.html`), "x".repeat(i));
      }
      const output = (await collectBuildOutput(dist))!;
      const rendered = formatBuildSummary(output);
      expect(rendered).toContain("... and 5 more files");
    });

    it("uses singular 'file' for a single output", async () => {
      await writeFile(join(dist, "only.html"), "x".repeat(10));
      const output = (await collectBuildOutput(dist))!;
      const rendered = formatBuildSummary(output);
      expect(rendered).toContain("📈 Total: 1 file");
      expect(rendered).toContain("1 file");
    });

    it("contains no ANSI escape codes (CI-safe)", async () => {
      await writeFile(join(dist, "index.html"), "x".repeat(10));
      const output = (await collectBuildOutput(dist))!;
      expect(formatBuildSummary(output)).not.toContain("\u001b[");
    });
  });

  describe("generateBuildSummary", () => {
    it("returns the formatted string for a populated dist", async () => {
      await writeFile(join(dist, "index.html"), "x".repeat(100));
      const summary = await generateBuildSummary(dist);
      expect(summary).toContain("📈 Total: 1 file");
    });

    it("returns null for a missing dist", async () => {
      expect(await generateBuildSummary(join(dist, "nope"))).toBeNull();
    });
  });
});
