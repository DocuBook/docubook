import { describe, it, expect } from "vitest";
import type { DocuConfig } from "../node/types";
import { buildSeoMeta } from "../node/seo";

const BASE_CONFIG: DocuConfig = {
  meta: {
    title: "Flame - Docs Framework",
    description: "A blazing-fast docs framework",
    baseURL: "https://docubook.pro",
    favicon: "/favicon.ico",
  },
  navbar: { logoText: "DocuBook", menu: [] },
  footer: { social: [] },
  repo: { url: "", path: "", edit: false },
  routes: [],
};

describe("buildSeoMeta", () => {
  describe("basic metadata", () => {
    it("returns url for docs page with slug", () => {
      const result = buildSeoMeta(
        BASE_CONFIG,
        { title: "Installation" },
        "getting-started/installation"
      );
      expect(result.url).toBe("https://docubook.pro/docs/getting-started/installation");
    });

    it("returns the deployment root for the landing page", () => {
      const result = buildSeoMeta(BASE_CONFIG, {}, "", "landing");
      expect(result.url).toBe("https://docubook.pro/");
    });

    it("returns the docs prefix for the docs index, not the landing page", () => {
      expect(buildSeoMeta(BASE_CONFIG, {}, "").url).toBe("https://docubook.pro/docs/");
      const handbook = { ...BASE_CONFIG, meta: { ...BASE_CONFIG.meta, basePath: "/handbook/v2" } };
      expect(buildSeoMeta(handbook, {}, "").url).toBe("https://docubook.pro/handbook/v2/");
      const project = {
        ...BASE_CONFIG,
        meta: { ...BASE_CONFIG.meta, baseURL: "https://acme.github.io/repo/" },
      };
      expect(buildSeoMeta(project, {}, "").url).toBe("https://acme.github.io/repo/docs/");
      expect(buildSeoMeta(project, {}, "", "landing").url).toBe("https://acme.github.io/repo/");
    });

    it("gives the docs index the root at a root deployment, where the two coincide", () => {
      const root = { ...BASE_CONFIG, meta: { ...BASE_CONFIG.meta, basePath: "" } };
      expect(buildSeoMeta(root, {}, "").url).toBe("https://docubook.pro/");
      expect(buildSeoMeta(root, {}, "guide/routing").url).toBe(
        "https://docubook.pro/guide/routing"
      );
    });

    it("sets siteName from config meta.title", () => {
      const result = buildSeoMeta(BASE_CONFIG, {}, "");
      expect(result.siteName).toBe("Flame - Docs Framework");
    });

    it("does not set image when frontmatter has no image", () => {
      const result = buildSeoMeta(BASE_CONFIG, {}, "test");
      expect(result.image).toBeUndefined();
    });
  });

  describe("og:image resolution", () => {
    it("accepts absolute http image", () => {
      const result = buildSeoMeta(
        BASE_CONFIG,
        { title: "Test", image: "https://cdn.example.com/og.png" },
        "test"
      );
      expect(result.image).toBe("https://cdn.example.com/og.png");
    });

    it("resolves root-relative image against baseURL", () => {
      const result = buildSeoMeta(
        BASE_CONFIG,
        { title: "Test", image: "/images/custom-og.png" },
        "test"
      );
      expect(result.image).toBe("https://docubook.pro/images/custom-og.png");
    });

    it("resolves relative image against baseURL/docs/", () => {
      const result = buildSeoMeta(BASE_CONFIG, { title: "Test", image: "custom-og.png" }, "test");
      expect(result.image).toBe("https://docubook.pro/docs/custom-og.png");
    });
  });

  describe("config-level fallback (meta.ogImage)", () => {
    const CONFIG_WITH_OG = {
      ...BASE_CONFIG,
      meta: {
        ...BASE_CONFIG.meta,
        ogImage: "/docs/assets/images/og.png",
      },
    };

    it("falls back to config.meta.ogImage when frontmatter has no image", () => {
      const result = buildSeoMeta(CONFIG_WITH_OG, {}, "test");
      expect(result.image).toBe("https://docubook.pro/docs/assets/images/og.png");
    });

    it("frontmatter.image overrides config.meta.ogImage", () => {
      const result = buildSeoMeta(CONFIG_WITH_OG, { image: "/custom.png" }, "test");
      expect(result.image).toBe("https://docubook.pro/custom.png");
    });

    it("uses config.meta.ogImage for landing page (empty slug)", () => {
      const result = buildSeoMeta(CONFIG_WITH_OG, {}, "", "landing");
      expect(result.image).toBe("https://docubook.pro/docs/assets/images/og.png");
    });
  });

  describe("edge cases", () => {
    it("handles missing baseURL gracefully", () => {
      const config = {
        ...BASE_CONFIG,
        meta: { ...BASE_CONFIG.meta, baseURL: "" },
      };
      const result = buildSeoMeta(config, {}, "test");
      expect(result.url).toBe("/docs/test");
    });

    it("handles baseURL with trailing slash", () => {
      const config = {
        ...BASE_CONFIG,
        meta: { ...BASE_CONFIG.meta, baseURL: "https://docubook.pro/" },
      };
      const result = buildSeoMeta(config, {}, "getting-started/intro");
      expect(result.url).toBe("https://docubook.pro/docs/getting-started/intro");
    });

    it("falls back to config.meta.ogImage on empty frontmatter", () => {
      const config = {
        ...BASE_CONFIG,
        meta: { ...BASE_CONFIG.meta, ogImage: "/docs/assets/images/og.png" },
      };
      const result = buildSeoMeta(config, {}, "", "landing");
      expect(result.url).toBe("https://docubook.pro/");
      expect(result.siteName).toBe("Flame - Docs Framework");
      expect(result.image).toBe("https://docubook.pro/docs/assets/images/og.png");
    });

    it("ignores non-string image values in frontmatter", () => {
      const result = buildSeoMeta(BASE_CONFIG, { image: 123 } as Record<string, unknown>, "test");
      expect(result.image).toBeUndefined();
    });
  });
});

describe("og:image under a deployment path", () => {
  // The dist is published under baseURL's path; content assets sit in
  // <basePath>/assets inside it. Each case names what the author wrote.
  const cases: Array<[basePath: string, baseURL: string, image: string, expected: string]> = [
    // basePath's first segment equals the deployment path: nothing may be cut off.
    [
      "/repo",
      "https://acme.github.io/repo",
      "/docs/assets/images/og.png",
      "https://acme.github.io/repo/repo/assets/images/og.png",
    ],
    [
      "/repo",
      "https://acme.github.io/repo",
      "/repo/assets/og.png",
      "https://acme.github.io/repo/repo/assets/og.png",
    ],
    [
      "/repo",
      "https://acme.github.io/repo",
      "/repo/repo/assets/og.png",
      "https://acme.github.io/repo/repo/assets/og.png",
    ],
    // The author spelled the host segment out: it is dropped, then re-based.
    [
      "/docs",
      "https://acme.github.io/repo",
      "/repo/docs/assets/og.png",
      "https://acme.github.io/repo/docs/assets/og.png",
    ],
    [
      "/handbook",
      "https://acme.github.io/repo",
      "/repo/docs/assets/og.png",
      "https://acme.github.io/repo/handbook/assets/og.png",
    ],
    [
      "/handbook",
      "https://acme.github.io/repo",
      "/docs/assets/og.png",
      "https://acme.github.io/repo/handbook/assets/og.png",
    ],
    // Root deployment under a host path.
    [
      "",
      "https://acme.github.io/repo",
      "/docs/assets/og.png",
      "https://acme.github.io/repo/assets/og.png",
    ],
    [
      "",
      "https://acme.github.io/repo",
      "/repo/assets/og.png",
      "https://acme.github.io/repo/assets/og.png",
    ],
    // Bare relative images resolve against the prefix; the deployment path
    // is never stripped from that synthesized path.
    [
      "/repo",
      "https://acme.github.io/repo",
      "docs/og.png",
      "https://acme.github.io/repo/repo/docs/og.png",
    ],
    ["", "https://acme.github.io/repo", "repo/og.png", "https://acme.github.io/repo/repo/og.png"],
    ["/docs", "https://acme.github.io/repo", "og.png", "https://acme.github.io/repo/docs/og.png"],
    // No deployment path.
    ["/docs", "https://acme.dev", "/docs/assets/og.png", "https://acme.dev/docs/assets/og.png"],
    ["/repo", "https://acme.dev", "/docs/assets/og.png", "https://acme.dev/repo/assets/og.png"],
  ];
  for (const [basePath, baseURL, image, expected] of cases) {
    it(`basePath ${JSON.stringify(basePath)} under ${baseURL}: ${image}`, () => {
      const config = { ...BASE_CONFIG, meta: { ...BASE_CONFIG.meta, basePath, baseURL } };
      expect(buildSeoMeta(config, { image }, "guide/routing").image).toBe(expected);
    });
  }
});

describe("landing page SEO in both builds", () => {
  it("marks the landing page call so it keeps the root canonical", async () => {
    const { readFileSync } = await import("node:fs");
    for (const file of ["build.ts", "build.impl.ts"]) {
      const src = readFileSync(new URL(`../node/${file}`, import.meta.url), "utf-8");
      expect(src, file).toMatch(/const landingSeo = buildSeoMeta\([\s\S]*?"",\s*"landing"\s*\)/);
      // Docs pages, the docs index included, use the default "docs" page kind.
      expect(src, file).toContain('const seo = buildSeoMeta(docuConfig, frontmatter, slug || "");');
    }
  });
});
