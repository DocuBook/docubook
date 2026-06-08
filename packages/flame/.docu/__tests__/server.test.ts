import { describe, it, expect } from "vitest";
import {
  SECURITY_HEADERS,
  generateNonce,
  cspHeader,
  htmlResponse,
  isPathSafe,
  isSlugSafe,
} from "../node/security";
import { getContentType } from "../node/utils";
import { hmrScript } from "../node/html";

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
    it("returns a UUID string", () => {
      const nonce = generateNonce();
      expect(nonce).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
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
