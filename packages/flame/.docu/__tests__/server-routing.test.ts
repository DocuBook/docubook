/**
 * Integration tests for server routing logic.
 *
 * Tests the core routing patterns extracted from server.ts:
 * - serveStatic: file serving with path traversal protection
 * - Route dispatch: pathname → handler mapping logic
 * - Error boundaries: errorHtml + security headers on error
 * - Static asset fallback: docs/assets/ dual-path resolution
 * - HMR stream lifecycle: SSE client management
 * - Response creation: htmlResponse with security headers
 *
 * server.ts has module-level side effects (config loading, Bun.build, watcher),
 * so we test the routing patterns and logic directly rather than importing the module.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  SECURITY_HEADERS,
  htmlResponse,
  isPathSafe,
  generateNonce,
  cspHeader,
} from "../node/security";
import { getContentType, stripDocsHtmlSuffix } from "../node/utils";
import { errorHtml, hmrScript, htmlShell } from "../node/html.shared";

// ─── Helpers ────────────────────────────────────────────

/**
 * Simulates the route dispatch pattern from server.ts.
 * Given a pathname, determines which handler should process it.
 */
type RouteHandler = "serveStatic" | "handleDocs" | "handleIndex" | "handle404" | "handleHmr";

function dispatchRoute(pathname: string): RouteHandler {
  if (pathname === "/__hmr") return "handleHmr";
  if (pathname.startsWith("/assets/") || /\.\w+$/.test(pathname)) return "serveStatic";
  if (pathname === "/") return "handleIndex";
  if (pathname.startsWith("/docs")) return "handleDocs";
  return "handle404";
}

/**
 * Simulates the Bun.FileSystemRouter match result from server.ts.
 */
interface RouteMatch {
  name: string;
  params?: Record<string, string | undefined>;
}

function matchRoute(pathname: string): RouteMatch | null {
  if (pathname === "/" || pathname === "") {
    return { name: "/" };
  }
  if (pathname === "/404" || pathname === "/404.html") {
    return { name: "/404" };
  }
  const docsMatch = pathname.match(/^\/docs(?:\/(.+))?$/);
  if (docsMatch) {
    return { name: "/docs/[[...slug]]", params: { slug: docsMatch[1] } };
  }
  return null;
}

/**
 * Slug parser from docs pathname.
 */
function parseDocsSlug(pathname: string): string[] | null {
  const match = pathname.match(/^\/docs(?:\/(.+))?$/);
  if (!match) return null;
  const slugParam = match[1];
  return slugParam ? slugParam.split("/") : [];
}

// ─── ServeStatic Tests ──────────────────────────────────

describe("serveStatic — integration", () => {
  let distDir: string;
  let docsAssetsDir: string;

  beforeAll(() => {
    // Create temp directories
    distDir = mkdtempSync(join(tmpdir(), "flame-test-dist-"));
    docsAssetsDir = mkdtempSync(join(tmpdir(), "flame-test-docs-assets-"));

    // Create test files
    writeFileSync(join(distDir, "test.css"), "body { color: red; }");
    writeFileSync(join(distDir, "app.js"), "console.log('hello');");
    writeFileSync(join(distDir, "data.json"), '{"key": "value"}');
    writeFileSync(join(distDir, "logo.png"), "fake-png");
    writeFileSync(join(distDir, "favicon.ico"), "fake-ico");

    // Nested directory
    mkdirSync(join(distDir, "images"), { recursive: true });
    writeFileSync(join(distDir, "images", "photo.jpg"), "fake-jpg");

    // Docs assets
    writeFileSync(join(docsAssetsDir, "doc-image.svg"), "<svg></svg>");
  });

  afterAll(() => {
    rmSync(distDir, { recursive: true, force: true });
    rmSync(docsAssetsDir, { recursive: true, force: true });
  });

  /**
   * Simulates serveStatic from server.ts.
   */
  function serveStatic(pathname: string): Response | null {
    if (!isPathSafe(pathname, distDir)) return null;
    const decoded = decodeURIComponent(pathname);
    const assetPath = join(distDir, decoded.slice(1));
    try {
      const s = statSync(assetPath);
      if (s.isFile()) {
        return new Response(readFileSync(assetPath), {
          headers: { "Content-Type": getContentType(pathname) },
        });
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }

    // Docs assets fallback
    if (decoded.startsWith("/docs/assets/")) {
      const docsAsset = join(docsAssetsDir, decoded.replace("/docs/assets/", ""));
      try {
        const s = statSync(docsAsset);
        if (s.isFile()) {
          return new Response(readFileSync(docsAsset), {
            headers: { "Content-Type": getContentType(pathname) },
          });
        }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      }
    }
    return null;
  }

  it("serves CSS files with correct content type", () => {
    const res = serveStatic("/test.css");
    expect(res).not.toBeNull();
    expect(res!.headers.get("Content-Type")).toBe("text/css");
  });

  it("serves JavaScript files with correct content type", () => {
    const res = serveStatic("/app.js");
    expect(res).not.toBeNull();
    expect(res!.headers.get("Content-Type")).toBe("application/javascript");
  });

  it("serves JSON files with correct content type", () => {
    const res = serveStatic("/data.json");
    expect(res).not.toBeNull();
    expect(res!.headers.get("Content-Type")).toBe("application/json");
  });

  it("serves image files with correct content type", () => {
    const res = serveStatic("/logo.png");
    expect(res).not.toBeNull();
    expect(res!.headers.get("Content-Type")).toBe("image/png");

    const jpg = serveStatic("/images/photo.jpg");
    expect(jpg).not.toBeNull();
    expect(jpg!.headers.get("Content-Type")).toBe("image/jpeg");
  });

  it("falls back to docs/assets/ for /docs/assets/ paths", () => {
    const res = serveStatic("/docs/assets/doc-image.svg");
    expect(res).not.toBeNull();
    expect(res!.headers.get("Content-Type")).toBe("image/svg+xml");
  });

  it("returns null for non-existent files", () => {
    const res = serveStatic("/nonexistent.js");
    expect(res).toBeNull();
  });

  it("returns null for directories", () => {
    const res = serveStatic("/images");
    expect(res).toBeNull();
  });

  it("rejects path traversal attempts", () => {
    expect(serveStatic("/../etc/passwd")).toBeNull();
    expect(serveStatic("/..%2F..%2Fetc/shadow")).toBeNull();
    expect(serveStatic("/docs/assets/../../../etc/hosts")).toBeNull();
  });

  it("rejects prefix-match bypass attempts", () => {
    // Given distDir = /tmp/flame-test-dist-xxx
    // /../dist-extra/file resolves outside distDir after resolve()
    expect(serveStatic("/../dist-extra/file")).toBeNull();
    expect(serveStatic("/../dist_secret")).toBeNull();
  });

  it("serves file from nested directory path", () => {
    const res = serveStatic("/images/photo.jpg");
    expect(res).not.toBeNull();
    expect(res!.headers.get("Content-Type")).toBe("image/jpeg");
  });
});

// ─── Route Dispatch Tests ───────────────────────────────

describe("route dispatch", () => {
  describe("dispatchRoute — pathname → handler mapping", () => {
    it("routes /__hmr to handleHmr", () => {
      expect(dispatchRoute("/__hmr")).toBe("handleHmr");
    });

    it("routes /assets/* to serveStatic", () => {
      expect(dispatchRoute("/assets/app.js")).toBe("serveStatic");
      expect(dispatchRoute("/assets/style.css")).toBe("serveStatic");
    });

    it("routes files with extensions to serveStatic", () => {
      expect(dispatchRoute("/favicon.ico")).toBe("serveStatic");
      expect(dispatchRoute("/robots.txt")).toBe("serveStatic");
      expect(dispatchRoute("/sitemap.xml")).toBe("serveStatic");
    });

    it("routes / to handleIndex", () => {
      expect(dispatchRoute("/")).toBe("handleIndex");
    });

    it("routes /docs/* to handleDocs", () => {
      expect(dispatchRoute("/docs")).toBe("handleDocs");
      expect(dispatchRoute("/docs/getting-started")).toBe("handleDocs");
      expect(dispatchRoute("/docs/guides/installation")).toBe("handleDocs");
    });

    it("routes unknown paths to handle404", () => {
      expect(dispatchRoute("/about")).toBe("handle404");
      expect(dispatchRoute("/api/data")).toBe("handle404");
      expect(dispatchRoute("/unknown")).toBe("handle404");
    });
  });

  describe("matchRoute — Bun.FileSystemRouter simulation", () => {
    it("matches / as index route", () => {
      expect(matchRoute("/")).toEqual({ name: "/" });
    });

    it("matches /404 as 404 route", () => {
      expect(matchRoute("/404")).toEqual({ name: "/404" });
      expect(matchRoute("/404.html")).toEqual({ name: "/404" });
    });

    it("matches /docs as catch-all route with no slug", () => {
      const match = matchRoute("/docs");
      expect(match).not.toBeNull();
      expect(match!.name).toBe("/docs/[[...slug]]");
      expect(match!.params?.slug).toBeUndefined();
    });

    it("matches /docs/slug as catch-all with single segment", () => {
      const match = matchRoute("/docs/getting-started");
      expect(match).not.toBeNull();
      expect(match!.name).toBe("/docs/[[...slug]]");
      expect(match!.params?.slug).toBe("getting-started");
    });

    it("matches /docs/a/b/c as catch-all with nested slug", () => {
      const match = matchRoute("/docs/guides/advanced/customization");
      expect(match).not.toBeNull();
      expect(match!.params?.slug).toBe("guides/advanced/customization");
    });

    it("returns null for unmatched paths", () => {
      expect(matchRoute("/about")).toBeNull();
      expect(matchRoute("/api")).toBeNull();
      expect(matchRoute("/docsx")).toBeNull();
    });
  });

  describe("stripDocsHtmlSuffix — .html link normalization", () => {
    it("strips .html from docs pathnames", () => {
      expect(stripDocsHtmlSuffix("/docs/getting-started.html")).toBe("/docs/getting-started");
      expect(stripDocsHtmlSuffix("/docs/guides/installation.html")).toBe(
        "/docs/guides/installation"
      );
    });

    it("normalized pathnames parse to the expected slug", () => {
      expect(parseDocsSlug(stripDocsHtmlSuffix("/docs/getting-started.html"))).toEqual([
        "getting-started",
      ]);
      expect(
        parseDocsSlug(stripDocsHtmlSuffix("/docs/guides/advanced/customization.html"))
      ).toEqual(["guides", "advanced", "customization"]);
    });

    it("normalized docs pathnames dispatch to handleDocs instead of serveStatic", () => {
      expect(dispatchRoute(stripDocsHtmlSuffix("/docs/getting-started.html"))).toBe("handleDocs");
    });

    it("leaves extensionless and non-docs pathnames untouched", () => {
      expect(stripDocsHtmlSuffix("/docs/getting-started")).toBe("/docs/getting-started");
      expect(stripDocsHtmlSuffix("/docs")).toBe("/docs");
      expect(stripDocsHtmlSuffix("/404.html")).toBe("/404.html");
      expect(stripDocsHtmlSuffix("/assets/app.js")).toBe("/assets/app.js");
      expect(stripDocsHtmlSuffix("/docs/assets/image.png")).toBe("/docs/assets/image.png");
    });
  });

  describe("parseDocsSlug — slug extraction from pathname", () => {
    it("parses /docs as empty slug array", () => {
      expect(parseDocsSlug("/docs")).toEqual([]);
    });

    it("returns null for /docs/ with trailing slash", () => {
      // Bun.FileSystemRouter normalizes trailing slashes
      expect(parseDocsSlug("/docs/")).toBeNull();
    });

    it("parses single segment slug", () => {
      expect(parseDocsSlug("/docs/getting-started")).toEqual(["getting-started"]);
    });

    it("parses nested slug", () => {
      expect(parseDocsSlug("/docs/guides/installation")).toEqual(["guides", "installation"]);
    });

    it("parses deep nested slug", () => {
      expect(parseDocsSlug("/docs/api/reference/v2/intro")).toEqual([
        "api",
        "reference",
        "v2",
        "intro",
      ]);
    });

    it("returns null for non-docs paths", () => {
      expect(parseDocsSlug("/")).toBeNull();
      expect(parseDocsSlug("/about")).toBeNull();
      expect(parseDocsSlug("/assets/style.css")).toBeNull();
    });
  });
});

// ─── Error Boundary Tests ───────────────────────────────

describe("error boundaries", () => {
  describe("errorHtml", () => {
    it("returns valid HTML with error message", () => {
      const html = errorHtml("Something went wrong");
      expect(html).toContain("Something went wrong");
      expect(html).toContain("Server Error");
      expect(html).toContain("<!DOCTYPE html>");
    });

    it("includes stack trace when provided", () => {
      const stack = "Error: test\n    at Object.<anonymous> (test.ts:1:1)";
      const html = errorHtml("test", stack);
      expect(html).toContain("test.ts:1:1");
    });

    it("escapes HTML in error message", () => {
      const html = errorHtml("<script>alert(1)</script>");
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    });

    it("returns safe HTML for unknown errors", () => {
      const html = errorHtml("");
      expect(html).toContain("Server Error");
      expect(html).not.toContain("undefined");
    });
  });

  describe("error response pattern", () => {
    /**
     * Simulates the error handler from server.ts Bun.serve error callback.
     */
    function createErrorResponse(message: string, _stack?: string): Response {
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

    it("returns 500 status for server errors", () => {
      const res = createErrorResponse("test error");
      expect(res.status).toBe(500);
    });

    it("includes security headers on error", () => {
      const res = createErrorResponse("test");
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("Strict-Transport-Security")).toContain("max-age=");
      expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    });

    it("uses restrictive CSP on error pages", () => {
      const res = createErrorResponse("test");
      expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
      expect(res.headers.get("Content-Security-Policy")).toContain("style-src 'unsafe-inline'");
    });
  });

  describe("fetch handler error boundary pattern", () => {
    /**
     * Simulates the try/catch pattern from server.ts fetch handler.
     */
    function fetchHandler(pathname: string): { status: number; headers: Record<string, string> } {
      try {
        // Simulate a route that throws
        if (pathname === "/crash") {
          throw new Error("Unexpected error in handler");
        }
        // Normal successful response
        return { status: 200, headers: { "Content-Type": "text/html" } };
      } catch {
        // Simulates the catch block from server.ts
        return {
          status: 500,
          headers: {
            "Content-Type": "text/html",
            "X-Frame-Options": "DENY",
            "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
          },
        };
      }
    }

    it("returns 500 for handler errors with safe CSP", () => {
      const result = fetchHandler("/crash");
      expect(result.status).toBe(500);
      expect(result.headers["Content-Security-Policy"]).toContain("default-src 'none'");
    });

    it("returns 200 for normal requests", () => {
      const result = fetchHandler("/docs");
      expect(result.status).toBe(200);
    });
  });
});

// ─── HMR Stream Tests ───────────────────────────────────

describe("HMR stream lifecycle", () => {
  describe("SSE client management pattern", () => {
    it("tracks connected clients in a Set", () => {
      const clients = new Set<ReadableStreamDefaultController>();

      const controller1 = {} as ReadableStreamDefaultController;
      const controller2 = {} as ReadableStreamDefaultController;

      clients.add(controller1);
      clients.add(controller2);
      expect(clients.size).toBe(2);

      clients.delete(controller1);
      expect(clients.size).toBe(1);
    });

    it("broadcasts reload event to all clients", () => {
      const clients = new Set<ReadableStreamDefaultController>();
      const received: string[] = [];

      // This simulates the watcher callback from server.ts
      function broadcastReload() {
        for (const client of [...clients]) {
          try {
            new TextEncoder().encode("data: reload\n\n");
            // In real code this would be client.enqueue(encoded chunk)
            // Here we just track the call
            received.push("reload");
          } catch {
            clients.delete(client);
          }
        }
      }

      const c1 = {} as ReadableStreamDefaultController;
      const c2 = {} as ReadableStreamDefaultController;
      clients.add(c1);
      clients.add(c2);

      broadcastReload();
      expect(received).toHaveLength(2);
      expect(received).toEqual(["reload", "reload"]);
    });

    it("removes failed clients during broadcast", () => {
      const clients = new Set<ReadableStreamDefaultController>();

      // Create a controller that throws when enqueued
      function broadcastReload() {
        for (const client of [...clients]) {
          try {
            new TextEncoder().encode("data: reload\n\n");
            // client.enqueue(encoded chunk) would throw here
            throw new Error("enqueue failed");
          } catch {
            clients.delete(client);
          }
        }
      }

      const badController = {} as ReadableStreamDefaultController;
      clients.add(badController);
      broadcastReload();
      expect(clients.size).toBe(0);
    });
  });

  describe("HMR stream creation", () => {
    it("creates SSE response with correct headers", () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("data: connected\n\n"));
        },
      });
      const response = new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });

      expect(response.headers.get("Content-Type")).toBe("text/event-stream");
      expect(response.headers.get("Cache-Control")).toBe("no-cache");
      expect(response.headers.get("Connection")).toBe("keep-alive");
    });
  });

  describe("hmrScript", () => {
    it("includes nonce for CSP compatibility", () => {
      const script = hmrScript("test-nonce-123");
      expect(script).toContain('nonce="test-nonce-123"');
    });

    it("connects to /__hmr endpoint", () => {
      const script = hmrScript("n");
      expect(script).toContain('EventSource("/__hmr")');
    });

    it("reloads page on reload event", () => {
      const script = hmrScript("n");
      expect(script).toContain('e.data === "reload"');
      expect(script).toContain("window.location.reload()");
    });

    it("reconnects on error after 2s timeout", () => {
      const script = hmrScript("n");
      expect(script).toContain("es.onerror");
      expect(script).toContain("2000");
    });
  });
});

// ─── Response Creation Tests ────────────────────────────

describe("response creation", () => {
  describe("htmlResponse — from security.ts", () => {
    it("returns text/html content type", () => {
      const res = htmlResponse("<html></html>", "n1", 200);
      expect(res.headers.get("Content-Type")).toBe("text/html");
    });

    it("attaches all security headers", () => {
      const res = htmlResponse("<html></html>", "n1", 200);
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("Strict-Transport-Security")).toContain("max-age=");
      expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(res.headers.get("Permissions-Policy")).toContain("camera=()");
    });

    it("includes CSP with nonce", () => {
      const res = htmlResponse("<html></html>", "nonce-abc", 200);
      const csp = res.headers.get("Content-Security-Policy")!;
      expect(csp).toContain("'nonce-nonce-abc'");
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it("includes unsafe-eval only when allowEval is true", () => {
      const prod = htmlResponse("<html></html>", "n", 200, false);
      expect(prod.headers.get("Content-Security-Policy")).not.toContain("unsafe-eval");

      const dev = htmlResponse("<html></html>", "n", 200, true);
      expect(dev.headers.get("Content-Security-Policy")).toContain("unsafe-eval");
    });

    it("supports custom status codes", () => {
      expect(htmlResponse("", "n", 200).status).toBe(200);
      expect(htmlResponse("", "n", 404).status).toBe(404);
      expect(htmlResponse("", "n", 500).status).toBe(500);
    });
  });
});

// ─── Full Page Response Integration Tests ───────────────

describe("full page response — htmlShell + htmlResponse", () => {
  it("generates valid HTML shell with title and body", () => {
    const body = "<p>Hello World</p>";
    const title = "Test Page";
    const description = "A test page";

    const nonce = generateNonce();
    const html = htmlShell({
      title,
      description,
      body,
      favicon: "/favicon.ico",
      css: "style.css",
      js: "app.js",
      nonce,
    });

    expect(html).toContain(title);
    expect(html).toContain(description);
    expect(html).toContain("<p>Hello World</p>");
    expect(html).toContain("<!DOCTYPE html>");

    // Verify it can be wrapped in htmlResponse
    const res = htmlResponse(html, nonce, 200);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html");
  });

  it("escapes HTML in title and description", () => {
    const nonce = generateNonce();
    const html = htmlShell({
      title: "<script>alert('xss')</script>",
      description: "Test <b>desc</b>",
      body: "<p>safe</p>",
      favicon: "/favicon.ico",
      css: "style.css",
      js: "app.js",
      nonce,
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;desc&lt;/b&gt;");
  });

  it("injects nonce into inline script tags", () => {
    const nonce = "my-nonce-123";
    const html = htmlShell({
      title: "Test",
      description: "",
      body: "<p>test</p>",
      favicon: "/favicon.ico",
      css: "style.css",
      js: "app.js",
      nonce,
    });

    // The inline theme script should have nonce
    expect(html).toContain(`nonce="${nonce}"`);
  });
});

// ─── Watcher Pattern Tests ──────────────────────────────

describe("file watcher pattern", () => {
  describe("debounced HMR trigger", () => {
    it("debounces rapid file changes into single reload", async () => {
      const reloads: number[] = [];
      let timeout: ReturnType<typeof setTimeout> | null = null;

      function onFileChange() {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          reloads.push(Date.now());
        }, 300);
      }

      // Simulate rapid file changes
      onFileChange(); // t=0
      await new Promise((r) => setTimeout(r, 50));
      onFileChange(); // t=50 — resets debounce
      await new Promise((r) => setTimeout(r, 50));
      onFileChange(); // t=100 — resets debounce again
      await new Promise((r) => setTimeout(r, 50));
      onFileChange(); // t=150 — resets debounce again

      // Wait for debounce to fire
      await new Promise((r) => setTimeout(r, 500));

      // Should have exactly 1 reload, not 4
      expect(reloads.length).toBe(1);
    });

    it("ignores non-MDX files", () => {
      const changes: string[] = [];
      const allowedExts = [".mdx", ".md"];

      function handleChange(filename: string | null) {
        if (!filename) return;
        if (!allowedExts.some((ext) => filename.endsWith(ext))) return;
        changes.push(filename);
      }

      handleChange("index.mdx");
      handleChange("guide.md");
      handleChange("style.css"); // ignored
      handleChange("app.ts"); // ignored
      handleChange(".DS_Store"); // ignored

      expect(changes).toEqual(["index.mdx", "guide.md"]);
    });
  });
});

// ─── 404 Handling Tests ─────────────────────────────────

describe("404 handling", () => {
  describe("renderPage for 404", () => {
    it("returns 404 status for not-found routes", () => {
      // Uses the same pattern as server.ts
      function notFoundResponse(): Response {
        const html = "<p>404 - Not Found</p>";
        return new Response(html, {
          status: 404,
          headers: {
            "Content-Type": "text/html",
            ...SECURITY_HEADERS,
            "Content-Security-Policy": cspHeader(generateNonce()),
          },
        });
      }

      const res = notFoundResponse();
      expect(res.status).toBe(404);
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    });

    it("uses pattern: unknown routes → renderPage(NotFoundPage, 404)", () => {
      // Simulates the default branch of the route matcher
      const unmatchedRoutes = ["/about", "/api", "/random", "/admin"];
      for (const route of unmatchedRoutes) {
        const match = matchRoute(route);
        expect(match).toBeNull();
      }
    });
  });
});
