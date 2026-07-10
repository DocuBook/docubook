import { describe, it, expect } from "vitest";
import {
  SECURITY_HEADERS,
  generateNonce,
  cspHeader,
  htmlResponse,
  isPathSafe,
  isSlugSafe,
  injectNonce,
} from "../node/security";
import { getContentType } from "../node/utils";
import { hmrScript } from "../node/html";
import { resolve } from "node:path";

describe("server: security", () => {
  describe("SECURITY_HEADERS", () => {
    it("includes all required security headers", () => {
      expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
      expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
      expect(SECURITY_HEADERS["Strict-Transport-Security"]).toContain("max-age=");
      expect(SECURITY_HEADERS["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
      expect(SECURITY_HEADERS["Permissions-Policy"]).toContain("camera=()");
    });
  });

  describe("generateNonce", () => {
    it("returns a base64 string", () => {
      const nonce = generateNonce();
      expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    });

    it("returns unique values", () => {
      const a = generateNonce();
      const b = generateNonce();
      expect(a).not.toBe(b);
    });
  });

  describe("cspHeader", () => {
    it("includes nonce in script-src", () => {
      const nonce = "test-nonce-123";
      const csp = cspHeader(nonce);
      expect(csp).toContain(`'nonce-${nonce}'`);
    });

    it("excludes unsafe-eval by default", () => {
      const csp = cspHeader("n");
      expect(csp).not.toContain("unsafe-eval");
    });

    it("includes unsafe-eval when allowEval is true", () => {
      const csp = cspHeader("n", true);
      expect(csp).toContain("unsafe-eval");
    });

    it("includes required directives", () => {
      const csp = cspHeader("n");
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    });
  });

  describe("htmlResponse", () => {
    it("returns response with correct status and headers", () => {
      const res = htmlResponse("<html></html>", "nonce-1", 200);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/html");
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
      expect(res.headers.get("Content-Security-Policy")).toContain("nonce-1");
    });

    it("excludes unsafe-eval from CSP by default", () => {
      const res = htmlResponse("<html></html>", "n", 200);
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).not.toContain("unsafe-eval");
    });

    it("includes unsafe-eval in CSP when allowEval is true", () => {
      const res = htmlResponse("<html></html>", "n", 200, true);
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("unsafe-eval");
    });

    it("supports custom status codes", () => {
      const res = htmlResponse("<html></html>", "n", 404);
      expect(res.status).toBe(404);
    });
  });
});

describe("server: static file serving", () => {
  describe("getContentType", () => {
    it("returns correct MIME types", () => {
      expect(getContentType("/assets/style.css")).toBe("text/css");
      expect(getContentType("/assets/app.js")).toBe("application/javascript");
      expect(getContentType("/images/logo.png")).toBe("image/png");
      expect(getContentType("/images/photo.jpg")).toBe("image/jpeg");
      expect(getContentType("/images/icon.svg")).toBe("image/svg+xml");
      expect(getContentType("/data.json")).toBe("application/json");
      expect(getContentType("/page.html")).toBe("text/html");
    });

    it("returns octet-stream for unknown extensions", () => {
      expect(getContentType("/file.xyz")).toBe("application/octet-stream");
      expect(getContentType("/noext")).toBe("application/octet-stream");
    });
  });

  describe("path traversal protection", () => {
    it("isPathSafe rejects paths outside baseDir", () => {
      const DIST_DIR = "/project/dist";

      expect(isPathSafe("/assets/style.css", DIST_DIR)).toBe(true);
      expect(isPathSafe("/../etc/passwd", DIST_DIR)).toBe(false);
      expect(isPathSafe("/..%2F..%2Fetc/passwd", DIST_DIR)).toBe(false);
      expect(isPathSafe("/docs/assets/../../../etc/passwd", DIST_DIR)).toBe(false);
    });

    it("isPathSafe rejects prefix-match bypass", () => {
      const DIST_DIR = "/project/dist";

      expect(isPathSafe("/../dist-extra/file", DIST_DIR)).toBe(false);
      expect(isPathSafe("/../dist_other", DIST_DIR)).toBe(false);
      expect(isPathSafe("/../dist2/config", DIST_DIR)).toBe(false);
    });

    it("decode before validate — encoded traversal is blocked by isPathSafe", () => {
      const DIST_DIR = "/project/dist";

      // serveStatic now decodes first, then validates the decoded path
      const encoded = "/..%2F..%2Fetc/passwd";
      const decoded = decodeURIComponent(encoded);

      // After decoding, the resolved path is a raw traversal — isPathSafe must reject it
      expect(isPathSafe(decoded, DIST_DIR)).toBe(false);
      // Double-encoded: %252F decodes once to %2F, then isPathSafe decodes again to /
      const doubleEncoded = "/..%252F..%252Fetc/passwd";
      const onceDecoded = decodeURIComponent(doubleEncoded);
      expect(isPathSafe(onceDecoded, DIST_DIR)).toBe(false);
    });
  });

  describe("malformed URI handling", () => {
    it("decodeURIComponent throws on malformed percent sequences", () => {
      expect(() => decodeURIComponent("%ZZ")).toThrow();
      expect(() => decodeURIComponent("%GG")).toThrow();
      expect(() => decodeURIComponent("%0Z")).toThrow();
    });

    it("serveStatic pattern — try/catch around decode returns null instead of crashing", () => {
      // Simulates serveStatic's guard: decode → catch → return null
      function serveSafe(pathname: string): null | string {
        try {
          return decodeURIComponent(pathname);
        } catch {
          return null;
        }
      }

      expect(serveSafe("/valid-path")).toBe("/valid-path");
      expect(serveSafe("/%ZZ")).toBeNull();
      expect(serveSafe("/%GG")).toBeNull();
      expect(serveSafe("path with spaces")).toBe("path with spaces");
    });
  });

  describe("docs assets path resolution", () => {
    it("slice removes first N chars after startsWith check, replace removes first substring match", () => {
      const prefix = "/docs/assets/";

      // Normal path — both approaches work
      expect("/docs/assets/main.js".slice(prefix.length)).toBe("main.js");
      expect("/docs/assets/images/logo.png".slice(prefix.length)).toBe("images/logo.png");

      // When prefix appears non-contiguously, replace still matches
      // e.g. if startsWith is true, slice(13) = replace(prefix, '')
      const path = "/docs/assets//docs/assets/../../../etc/passwd";
      const sliced = path.slice(prefix.length);
      const replaced = path.replace(prefix, "");
      // Both produce the same result when prefix is at position 0
      expect(sliced).toBe(replaced);
      expect(sliced).toBe("/docs/assets/../../../etc/passwd");
    });

    it("resolved docs asset path stays within DOCS_DIR/assets", () => {
      const DOCS_DIR = "/project/docs";
      const docsAssetsDir = resolve(DOCS_DIR, "assets");

      // Normal asset
      let relative = "styles/main.css";
      let assetPath = resolve(docsAssetsDir, relative);
      expect(assetPath.startsWith(docsAssetsDir)).toBe(true);

      // Traversal via relative path — resolved path leaves assets dir
      relative = "../../etc/passwd";
      assetPath = resolve(docsAssetsDir, relative);
      expect(assetPath.startsWith(docsAssetsDir)).toBe(false);
    });
  });
});

describe("server: route matching", () => {
  describe("docs slug parsing", () => {
    function parseDocsSlug(pathname: string): string[] | null {
      const match = pathname.match(/^\/docs(?:\/(.+))?$/);
      if (!match) return null;
      const slugParam = match[1];
      return slugParam ? slugParam.split("/") : [];
    }

    it("matches /docs as empty slug", () => {
      expect(parseDocsSlug("/docs")).toEqual([]);
    });

    it("does not match /docs/ with trailing slash", () => {
      // Bun.FileSystemRouter normalizes trailing slashes
      expect(parseDocsSlug("/docs/")).toBeNull();
    });

    it("parses single segment slug", () => {
      expect(parseDocsSlug("/docs/getting-started")).toEqual(["getting-started"]);
    });

    it("parses nested slug", () => {
      expect(parseDocsSlug("/docs/guides/installation")).toEqual(["guides", "installation"]);
    });

    it("returns null for non-docs paths", () => {
      expect(parseDocsSlug("/")).toBeNull();
      expect(parseDocsSlug("/about")).toBeNull();
    });
  });

  describe("isSlugSafe path resolution", () => {
    it("rejects path traversal attempts", () => {
      const DOCS_DIR = "/project/docs";

      expect(isSlugSafe("getting-started", DOCS_DIR)).toBe(true);
      expect(isSlugSafe("guides/install", DOCS_DIR)).toBe(true);
      expect(isSlugSafe("../etc/passwd", DOCS_DIR)).toBe(false);
      expect(isSlugSafe("../../secret", DOCS_DIR)).toBe(false);
    });

    it("isSlugSafe rejects prefix-match bypass", () => {
      const DOCS_DIR = "/project/docs";

      expect(isSlugSafe("../docs-extra/file", DOCS_DIR)).toBe(false);
      expect(isSlugSafe("../docs_backup", DOCS_DIR)).toBe(false);
      expect(isSlugSafe("../docsv2/config", DOCS_DIR)).toBe(false);
    });
  });
});

describe("injectNonce", () => {
  it("injects nonce into inline script tags", () => {
    const html = '<script>alert(1)</script><script src="ext.js"></script>';
    const result = injectNonce(html, "abc-123");
    expect(result).toContain('nonce="abc-123"');
    expect(result).toContain('<script src="ext.js"></script>');
  });

  it("replaces existing nonce with new nonce", () => {
    const html = '<script nonce="existing">alert(1)</script>';
    const result = injectNonce(html, "new-nonce");
    expect(result).toContain('nonce="new-nonce"');
    expect(result).not.toContain('nonce="existing"');
  });

  it("handles script tags with extra attributes", () => {
    const html = "<script defer async>init()</script>";
    const result = injectNonce(html, "n1");
    expect(result).toMatch(/<script\s+defer\s+async\s+nonce="n1">/);
  });

  it("handles uppercase SCRIPT tags", () => {
    const html = "<SCRIPT>alert(1)</SCRIPT>";
    const result = injectNonce(html, "u");
    expect(result).toContain('nonce="u"');
  });

  it("returns html unchanged when there are no script tags", () => {
    const html = "<div>hello</div>";
    expect(injectNonce(html, "n")).toBe(html);
  });
});

describe("server: HMR", () => {
  describe("hmrScript", () => {
    it("includes nonce attribute", () => {
      const script = hmrScript("abc-123");
      expect(script).toContain("abc-123");
      expect(script).toContain("nonce=");
    });

    it("connects to /__hmr endpoint", () => {
      const script = hmrScript("n");
      expect(script).toContain('EventSource("/__hmr")');
    });

    it("reloads on message", () => {
      const script = hmrScript("n");
      expect(script).toContain("window.location.reload()");
    });
  });

  describe("SSE client management", () => {
    it("tracks and removes clients", () => {
      const clients = new Set<object>();
      const controller = {};
      clients.add(controller);
      expect(clients.size).toBe(1);
      clients.delete(controller);
      expect(clients.size).toBe(0);
    });
  });
});

describe("server: error handling", () => {
  it("error response includes security headers", () => {
    // Simulates the error handler pattern from server.ts
    function createErrorResponse(message: string): Response {
      const html = `<h1>Error</h1><pre>${message}</pre>`;
      return new Response(html, {
        status: 500,
        headers: {
          "Content-Type": "text/html",
          ...SECURITY_HEADERS,
          "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
        },
      });
    }

    const res = createErrorResponse("test error");
    expect(res.status).toBe(500);
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
  });
});

import { wrapPluginResponse, type PluginResponseLike } from "../node/security";

function createPluginResponse(overrides?: {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
}): PluginResponseLike {
  return {
    status: 200,
    statusText: "OK",
    headers: new Headers({}),
    body: "plugin body",
    ...overrides,
    headers: new Headers(overrides?.headers ?? {}),
  };
}

describe("server: plugin security header wrapping", () => {
  it("adds all SECURITY_HEADERS when plugin response has no headers", () => {
    const res = wrapPluginResponse(createPluginResponse({ headers: {} }));

    expect(res.headers.get("Strict-Transport-Security")).toBe(
      "max-age=63072000; includeSubDomains; preload"
    );
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
  });

  it("preserves plugin headers when they overlap with SECURITY_HEADERS (plugin wins)", () => {
    const res = wrapPluginResponse(
      createPluginResponse({
        headers: {
          "X-Frame-Options": "SAMEORIGIN",
          "X-Content-Type-Options": "nosniff",
          "Custom-Header": "custom-value",
        },
      })
    );

    // Plugin's X-Frame-Options takes precedence over SECURITY_HEADERS default of DENY
    expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    // X-Content-Type-Options same value, but still from plugin
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    // Custom plugin headers are preserved
    expect(res.headers.get("Custom-Header")).toBe("custom-value");
    // Non-overlapping SECURITY_HEADERS are still applied
    expect(res.headers.get("Strict-Transport-Security")).toContain("max-age=");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("Permissions-Policy")).toContain("camera=()");
  });

  it("adds Content-Security-Policy for HTML plugin responses", () => {
    const res = wrapPluginResponse(
      createPluginResponse({
        headers: { "Content-Type": "text/html" },
        body: "<html><body>plugin page</body></html>",
      }),
      true
    );

    const csp = res.headers.get("Content-Security-Policy");
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    // unsafe-eval is included because server.ts passes allowEval=true for dev server
    expect(csp).toContain("unsafe-eval");
    // Nonce is present and valid UUID
    const nonceMatch = csp!.match(/'nonce-([a-f0-9-]+)'/);
    expect(nonceMatch).not.toBeNull();
    expect(nonceMatch![1]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("does NOT add Content-Security-Policy for non-HTML plugin responses", () => {
    const res = wrapPluginResponse(
      createPluginResponse({
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true }),
      })
    );

    expect(res.headers.get("Content-Security-Policy")).toBeNull();
  });

  it("does NOT add Content-Security-Policy for text/plain responses", () => {
    const res = wrapPluginResponse(
      createPluginResponse({
        headers: { "Content-Type": "text/plain" },
        body: "plain text",
      })
    );

    expect(res.headers.get("Content-Security-Policy")).toBeNull();
  });

  it("does NOT override plugin's existing Content-Security-Policy", () => {
    const res = wrapPluginResponse(
      createPluginResponse({
        headers: {
          "Content-Type": "text/html",
          "Content-Security-Policy": "default-src 'none'",
        },
      })
    );

    // Plugin's CSP is preserved, not replaced with generated one
    expect(res.headers.get("Content-Security-Policy")).toBe("default-src 'none'");
  });

  it("preserves plugin body, status, and statusText unchanged", () => {
    const body = "<html><body>Custom plugin content</body></html>";
    const res = wrapPluginResponse(
      createPluginResponse({
        status: 201,
        statusText: "Created",
        headers: { "Content-Type": "text/html" },
        body,
      })
    );

    expect(res.status).toBe(201);
    expect(res.statusText).toBe("Created");
    return res.text().then((text) => {
      expect(text).toBe(body);
    });
  });

  it("handles empty/null body plugin responses", () => {
    const res = wrapPluginResponse(
      createPluginResponse({
        status: 204,
        statusText: "No Content",
        headers: {},
        body: null,
      })
    );

    expect(res.status).toBe(204);
    expect(res.statusText).toBe("No Content");
    // Should still have security headers
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("adds CSP for HTML responses with charset in Content-Type", () => {
    const res = wrapPluginResponse(
      createPluginResponse({
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    );

    expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
  });

  it("preserves plugin headers case-insensitively (Headers API handles casing)", () => {
    const res = wrapPluginResponse(
      createPluginResponse({
        headers: {
          "x-frame-options": "SAMEORIGIN",
          "CONTENT-TYPE": "text/html",
        },
      })
    );

    // Headers API normalizes casing — plugin's lowercase X-Frame-Options still wins
    expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    // CSP should be added because our code checks !has() which is case-insensitive in Headers API
    expect(res.headers.get("Content-Security-Policy")).toBeTruthy();
  });
});
