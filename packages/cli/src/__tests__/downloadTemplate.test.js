import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { Writable } from "stream";

// Mock ora spinners
vi.mock("ora", () => ({
  default: () => ({ start: () => ({ succeed: vi.fn(), fail: vi.fn() }) }),
}));

// Mock tar extract — simulate extracting by creating the expected directory structure
vi.mock("tar", () => ({
  extract: ({ cwd }) => {
    return new Writable({
      write(chunk, enc, cb) {
        cb();
      },
      final(cb) {
        const templateDir = path.join(
          cwd,
          "docubook-main",
          "packages",
          "template",
          "nextjs-vercel"
        );
        fs.mkdirSync(templateDir, { recursive: true });
        fs.writeFileSync(path.join(templateDir, "package.json"), "{}");
        cb();
      },
    });
  },
}));

const { downloadTemplateFromGitHub } = await import("../installer/projectInstaller.js");

describe("downloadTemplateFromGitHub", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns templatePath on successful download and extract", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(c) {
          c.close();
        },
      }),
    });

    const result = await downloadTemplateFromGitHub(
      "nextjs-vercel",
      "https://github.com/DocuBook/docubook/tree/main/packages/template/nextjs-vercel"
    );

    expect(result.templatePath).toContain("nextjs-vercel");
    expect(fs.existsSync(result.templatePath)).toBe(true);
    expect(typeof result.cleanup).toBe("function");

    result.cleanup();
  });

  it("throws on invalid template URL", async () => {
    await expect(downloadTemplateFromGitHub("nextjs-vercel", "not-a-valid-url")).rejects.toThrow(
      "Invalid template URL"
    );
  });

  it("throws on HTTP error response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(
      downloadTemplateFromGitHub(
        "nextjs-vercel",
        "https://github.com/DocuBook/docubook/tree/main/packages/template/nextjs-vercel"
      )
    ).rejects.toThrow("HTTP 404");
  });

  it("throws on network failure", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network error"));

    await expect(
      downloadTemplateFromGitHub(
        "nextjs-vercel",
        "https://github.com/DocuBook/docubook/tree/main/packages/template/nextjs-vercel"
      )
    ).rejects.toThrow("network error");
  });
});
