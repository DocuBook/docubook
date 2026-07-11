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

    it("returns root url for empty slug", () => {
      const result = buildSeoMeta(BASE_CONFIG, {}, "");
      expect(result.url).toBe("https://docubook.pro/");
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
      const result = buildSeoMeta(CONFIG_WITH_OG, {}, "");
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
      const result = buildSeoMeta(config, {}, "");
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
