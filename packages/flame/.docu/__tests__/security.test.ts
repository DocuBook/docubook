import { describe, it, expect } from "vitest";
import { resolve, join } from "node:path";
import {
  normalizeImporterPath,
  cspHeader,
  isPathSafe,
  isSlugSafe,
  injectNonce,
  wrapPluginResponse,
} from "../node/security";

describe("normalizeImporterPath", () => {
  const CWD = process.cwd();
  const expectNormalized = (rel: string) => normalizeImporterPath(resolve(CWD, rel));

  it("is idempotent", () => {
    const input = `${CWD}/.docu/components/../components/Lucide.tsx`;
    const once = normalizeImporterPath(input);
    expect(normalizeImporterPath(once)).toBe(once);
  });

  it("collapses parent-directory segments", () => {
    expect(normalizeImporterPath(`${CWD}/.docu/components/../components/Lucide.tsx`)).toBe(
      expectNormalized(".docu/components/Lucide.tsx")
    );
  });

  it("collapses redundant separators", () => {
    expect(normalizeImporterPath(`${CWD}//.docu///components/Lucide.tsx`)).toBe(
      expectNormalized(".docu/components/Lucide.tsx")
    );
  });

  it("strips trailing slashes", () => {
    expect(normalizeImporterPath(`${resolve(CWD, ".docu/components")}/`)).toBe(
      expectNormalized(".docu/components")
    );
  });

  it("makes relative paths absolute against cwd", () => {
    expect(normalizeImporterPath(".docu/components/Lucide.tsx")).toBe(
      expectNormalized(".docu/components/Lucide.tsx")
    );
  });

  it("converts backslashes to forward slashes", () => {
    const input = `${CWD}\\sub\\dir`;
    const result = normalizeImporterPath(input);
    expect(result).not.toContain("\\");
    expect(result).toBe(`${CWD.replace(/\\/g, "/")}/sub/dir`);
  });
});

describe("cspHeader", () => {
  it("includes nonce in script-src", () => {
    const csp = cspHeader("abc123");
    expect(csp).toContain("script-src 'self' 'nonce-abc123'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("adds unsafe-eval when allowEval is true", () => {
    const csp = cspHeader("abc123", true);
    expect(csp).toContain("unsafe-eval");
  });

  it("includes frame-ancestors 'none'", () => {
    const csp = cspHeader("x");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("allows images from https: and data:", () => {
    const csp = cspHeader("x");
    expect(csp).toContain("img-src 'self' https: data:");
  });
});

describe("isPathSafe", () => {
  const BASE = process.cwd();

  it("allows a file within baseDir", () => {
    expect(isPathSafe("/docs/index.mdx", BASE)).toBe(true);
  });

  it("blocks path traversal with ../", () => {
    expect(isPathSafe("/../../etc/passwd", BASE)).toBe(false);
  });

  it("blocks deeply nested ../ traversal", () => {
    expect(isPathSafe("/../../../../etc/passwd", BASE)).toBe(false);
  });

  it("blocks encoded traversal %2e%2e%2f", () => {
    expect(isPathSafe("/%2e%2e/%2e%2e/etc/passwd", BASE)).toBe(false);
  });

  it("allows a non-existent file within baseDir", () => {
    expect(isPathSafe("/nonexistent/page.mdx", BASE)).toBe(true);
  });

  it("allows baseDir itself", () => {
    expect(isPathSafe("/", BASE)).toBe(true);
  });
});

describe("isSlugSafe", () => {
  const DOCS = join(process.cwd(), "docs");

  it("allows a slug within docsDir", () => {
    expect(isSlugSafe("getting-started/introduction", DOCS)).toBe(true);
  });

  it("blocks traversal slug", () => {
    expect(isSlugSafe("../../.env", DOCS)).toBe(false);
  });

  it("allows single-segment slug", () => {
    expect(isSlugSafe("api", DOCS)).toBe(true);
  });

  it("blocks traversal beyond docsDir", () => {
    expect(isSlugSafe("../../../", DOCS)).toBe(false);
  });
});

describe("injectNonce", () => {
  it("adds nonce to inline scripts", () => {
    const html = `<script>alert(1)</script>`;
    expect(injectNonce(html, "abc")).toBe(`<script nonce="abc">alert(1)</script>`);
  });

  it("skips scripts with src attribute", () => {
    const html = `<script src="/app.js"></script>`;
    expect(injectNonce(html, "abc")).toBe(html);
  });

  it("replaces existing nonce on inline scripts", () => {
    const html = `<script nonce="old">alert(1)</script>`;
    expect(injectNonce(html, "new")).toBe(`<script nonce="new">alert(1)</script>`);
  });

  it("handles multiple inline scripts", () => {
    const html = `<script>a()</script><script>b()</script>`;
    const result = injectNonce(html, "x");
    expect(result.match(/nonce="x"/g)).toHaveLength(2);
  });

  it("handles script with other attributes", () => {
    const html = `<script defer data-id="x">run()</script>`;
    const result = injectNonce(html, "n1");
    expect(result).toContain(`nonce="n1"`);
  });
});

describe("wrapPluginResponse", () => {
  it("fills missing security headers", () => {
    const pluginRes = {
      status: 200,
      headers: new Headers({ "Content-Type": "text/plain" }),
      body: "ok",
    };
    const res = wrapPluginResponse(pluginRes);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("Strict-Transport-Security")).toBe(
      "max-age=63072000; includeSubDomains; preload"
    );
  });

  it("does not override existing security headers", () => {
    const pluginRes = {
      status: 200,
      headers: new Headers({ "X-Frame-Options": "SAMEORIGIN" }),
      body: "ok",
    };
    const res = wrapPluginResponse(pluginRes);
    expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
  });

  it("adds CSP with nonce for HTML responses", () => {
    const pluginRes = {
      status: 200,
      headers: new Headers({ "Content-Type": "text/html" }),
      body: "<script>alert(1)</script>",
    };
    const res = wrapPluginResponse(pluginRes);
    const csp = res.headers.get("Content-Security-Policy");
    expect(csp).toBeTruthy();
    expect(csp).toContain("script-src");
    expect(csp).toContain("nonce-");
  });

  it("injects nonce into HTML body for inline scripts", async () => {
    const pluginRes = {
      status: 200,
      headers: new Headers({ "Content-Type": "text/html" }),
      body: "<script>run()</script>",
    };
    const res = wrapPluginResponse(pluginRes);
    const text = await res.text();
    expect(text).toContain('nonce="');
  });

  it("adds security headers to JSON response", async () => {
    const body = JSON.stringify({ error: "not found" });
    const pluginRes = {
      status: 404,
      headers: new Headers({ "Content-Type": "application/json" }),
      body,
    };
    const res = wrapPluginResponse(pluginRes);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe(body);
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("preserves plugin status and statusText", () => {
    const pluginRes = {
      status: 201,
      statusText: "Created",
      headers: new Headers(),
      body: "created",
    };
    const res = wrapPluginResponse(pluginRes);
    expect(res.status).toBe(201);
    expect(res.statusText).toBe("Created");
  });
});
