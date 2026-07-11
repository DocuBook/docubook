import { describe, it, expect } from "vitest";
import { htmlShell } from "../node/html";

const MINIMAL_OPTS = {
  title: "Test",
  description: "A test page",
  body: "<p>hello</p>",
  favicon: "/favicon.ico",
  css: "client-abc123.css",
  js: "client-xyz789.js",
};

describe("htmlShell", () => {
  describe("depth and relative paths", () => {
    it("uses 'assets/' prefix at root (depth=0 default)", () => {
      const html = htmlShell(MINIMAL_OPTS);
      expect(html).toContain('href="assets/client-abc123.css"');
      expect(html).toContain('src="assets/client-xyz789.js"');
    });

    it("uses '../assets/' prefix at depth=1", () => {
      const html = htmlShell({ ...MINIMAL_OPTS, depth: 1 });
      expect(html).toContain('href="../assets/client-abc123.css"');
      expect(html).toContain('src="../assets/client-xyz789.js"');
    });

    it("uses '../../assets/' prefix at depth=2", () => {
      const html = htmlShell({ ...MINIMAL_OPTS, depth: 2 });
      expect(html).toContain('href="../../assets/client-abc123.css"');
      expect(html).toContain('src="../../assets/client-xyz789.js"');
    });

    it("uses '../../../assets/' prefix at depth=3", () => {
      const html = htmlShell({ ...MINIMAL_OPTS, depth: 3 });
      expect(html).toContain('href="../../../assets/client-abc123.css"');
      expect(html).toContain('src="../../../assets/client-xyz789.js"');
    });
  });

  describe("resolvePath for favicon", () => {
    it("resolves absolute favicon path at root (depth=0)", () => {
      const html = htmlShell({
        ...MINIMAL_OPTS,
        favicon: "/docs/assets/images/favicon.ico",
      });
      expect(html).toContain('href="docs/assets/images/favicon.ico"');
    });

    it("resolves absolute favicon path at depth=1", () => {
      const html = htmlShell({
        ...MINIMAL_OPTS,
        favicon: "/docs/assets/images/favicon.ico",
        depth: 1,
      });
      expect(html).toContain('href="../docs/assets/images/favicon.ico"');
    });

    it("resolves absolute favicon path at depth=2", () => {
      const html = htmlShell({
        ...MINIMAL_OPTS,
        favicon: "/docs/assets/images/favicon.ico",
        depth: 2,
      });
      expect(html).toContain('href="../../docs/assets/images/favicon.ico"');
    });

    it("leaves relative favicon path unchanged", () => {
      const html = htmlShell({
        ...MINIMAL_OPTS,
        favicon: "favicon.ico",
      });
      expect(html).toContain('href="favicon.ico"');
    });

    it("omits favicon link when favicon is empty string", () => {
      const html = htmlShell({
        ...MINIMAL_OPTS,
        favicon: "",
      });
      expect(html).not.toContain('rel="icon"');
    });
  });

  describe("basic structure", () => {
    it("renders DOCTYPE and html tag", () => {
      const html = htmlShell(MINIMAL_OPTS);
      expect(html).toMatch(/^<!DOCTYPE html>\n<html/);
    });

    it("includes title and description", () => {
      const html = htmlShell(MINIMAL_OPTS);
      expect(html).toContain("<title>Test</title>");
      expect(html).toContain('content="A test page"');
    });

    it("renders body content", () => {
      const html = htmlShell(MINIMAL_OPTS);
      expect(html).toContain('<div id="root"><p>hello</p></div>');
    });
  });

  describe("nonce", () => {
    it("adds nonce attribute to script tags when provided", () => {
      const html = htmlShell({ ...MINIMAL_OPTS, nonce: "abc123" });
      expect(html).toContain('nonce="abc123"');
    });

    it("does not include nonce attribute when omitted", () => {
      const html = htmlShell(MINIMAL_OPTS);
      expect(html).not.toContain("nonce=");
    });
  });

  describe("CSP", () => {
    it("injects CSP meta tag when provided", () => {
      const html = htmlShell({ ...MINIMAL_OPTS, csp: "default-src 'self'" });
      expect(html).toContain('<meta http-equiv="Content-Security-Policy"');
      expect(html).toContain("default-src");
      expect(html).toContain("&#39;self&#39;");
    });

    it("omits CSP meta tag when not provided", () => {
      const html = htmlShell(MINIMAL_OPTS);
      expect(html).not.toContain("Content-Security-Policy");
    });
  });

  describe("theme CSS", () => {
    it("injects theme style tag when provided", () => {
      const html = htmlShell({ ...MINIMAL_OPTS, themeCss: "body{color:red}" });
      expect(html).toContain("<style");
      expect(html).toContain("body{color:red}");
    });

    it("omits theme style when not provided", () => {
      const html = htmlShell(MINIMAL_OPTS);
      expect(html).not.toContain("<style");
    });
  });

  describe("plugin injections", () => {
    it("injects headExtra before closing head", () => {
      const html = htmlShell({
        ...MINIMAL_OPTS,
        headExtra: ['<meta name="foo" content="bar">'],
      });
      expect(html).toContain('<meta name="foo" content="bar">');
    });

    it("injects bodyExtra before closing body", () => {
      const html = htmlShell({
        ...MINIMAL_OPTS,
        bodyExtra: ['<div id="custom">extra</div>'],
      });
      expect(html).toContain('<div id="custom">extra</div>');
    });

    it("injects multiple headExtra items", () => {
      const html = htmlShell({
        ...MINIMAL_OPTS,
        headExtra: ['<meta name="a">', '<meta name="b">'],
      });
      expect(html).toContain('<meta name="a">');
      expect(html).toContain('<meta name="b">');
    });
  });

  describe("extraScripts", () => {
    it("injects extraScripts when provided", () => {
      const html = htmlShell({
        ...MINIMAL_OPTS,
        extraScripts: '<script>console.log("extra")</script>',
      });
      expect(html).toContain('console.log("extra")');
    });
  });

  describe("XSS safety (Bun.escapeHTML)", () => {
    it("escapes title/description with special chars", () => {
      const html = htmlShell({
        ...MINIMAL_OPTS,
        title: 'Test & "Hello" <World>',
        description: "Foo & Bar",
      });
      expect(html).toContain("Test &amp; &quot;Hello&quot; &lt;World&gt;");
      expect(html).toContain("Foo &amp; Bar");
    });
  });

  describe("SEO meta tags", () => {
    const SEO_OPTS = {
      ...MINIMAL_OPTS,
      seo: {
        url: "https://docubook.pro/docs/test",
        siteName: "Flame Docs",
        image: "https://docubook.pro/og.png",
      },
    };

    it("renders og:title from page title", () => {
      const html = htmlShell(SEO_OPTS);
      expect(html).toContain('property="og:title"');
      expect(html).toContain('content="Test"');
    });

    it("renders og:description from page description", () => {
      const html = htmlShell(SEO_OPTS);
      expect(html).toContain('property="og:description"');
      expect(html).toContain('content="A test page"');
    });

    it("renders og:url from seo.url", () => {
      const html = htmlShell(SEO_OPTS);
      expect(html).toContain('property="og:url"');
      expect(html).toContain('content="https://docubook.pro/docs/test"');
    });

    it("renders og:type as website", () => {
      const html = htmlShell(SEO_OPTS);
      expect(html).toContain('property="og:type"');
      expect(html).toContain('content="website"');
    });

    it("renders og:site_name from seo.siteName", () => {
      const html = htmlShell(SEO_OPTS);
      expect(html).toContain('property="og:site_name"');
      expect(html).toContain('content="Flame Docs"');
    });

    it("renders og:image when seo.image is set", () => {
      const html = htmlShell(SEO_OPTS);
      expect(html).toContain('property="og:image"');
      expect(html).toContain('content="https://docubook.pro/og.png"');
    });

    it("renders twitter:card as summary_large_image", () => {
      const html = htmlShell(SEO_OPTS);
      expect(html).toContain('name="twitter:card"');
      expect(html).toContain('content="summary_large_image"');
    });

    it("renders canonical link", () => {
      const html = htmlShell(SEO_OPTS);
      expect(html).toContain('<link rel="canonical"');
      expect(html).toContain('href="https://docubook.pro/docs/test"');
    });

    it("omits og:image when seo has no image", () => {
      const html = htmlShell({
        ...MINIMAL_OPTS,
        seo: {
          url: "https://docubook.pro/docs/test",
          siteName: "Flame Docs",
        },
      });
      expect(html).not.toContain('property="og:image"');
    });

    it("omits all seo tags when seo is not provided", () => {
      const html = htmlShell(MINIMAL_OPTS);
      expect(html).not.toContain('property="og:title"');
      expect(html).not.toContain('property="og:url"');
      expect(html).not.toContain('name="twitter:card"');
      expect(html).not.toContain('rel="canonical"');
    });
  });
});
