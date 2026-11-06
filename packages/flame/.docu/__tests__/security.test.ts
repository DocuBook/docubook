import { describe, it, expect } from "vitest";
import { resolve, join } from "node:path";
import {
  normalizeImporterPath,
  cspHeader,
  cspMeta,
  isPathSafe,
  isSlugSafe,
  nonceInlineScripts,
  rotateNonce,
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

describe("cspMeta", () => {
  it("strips frame-ancestors for <meta> CSP", () => {
    const meta = cspMeta(cspHeader("x"));
    expect(meta).not.toContain("frame-ancestors");
    expect(meta).toContain("script-src 'self' 'nonce-x'");
  });

  it("leaves CSP without frame-ancestors unchanged", () => {
    expect(cspMeta("default-src 'self'")).toBe("default-src 'self'");
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

describe("nonceInlineScripts", () => {
  it("adds nonce to inline scripts", () => {
    const html = `<script>alert(1)</script>`;
    expect(nonceInlineScripts(html, "abc")).toBe(`<script nonce="abc">alert(1)</script>`);
  });

  it("skips scripts with src attribute", () => {
    const html = `<script src="/app.js"></script>`;
    expect(nonceInlineScripts(html, "abc")).toBe(html);
  });

  it("replaces existing nonce on inline scripts", () => {
    const html = `<script nonce="old">alert(1)</script>`;
    expect(nonceInlineScripts(html, "new")).toBe(`<script nonce="new">alert(1)</script>`);
  });

  it("handles multiple inline scripts", () => {
    const html = `<script>a()</script><script>b()</script>`;
    const result = nonceInlineScripts(html, "x");
    expect(result.match(/nonce="x"/g)).toHaveLength(2);
  });

  it("handles script with other attributes", () => {
    const html = `<script defer data-id="x">run()</script>`;
    const result = nonceInlineScripts(html, "n1");
    expect(result).toContain(`nonce="n1"`);
  });
});

describe("rotateNonce", () => {
  const meta = (nonce: string) =>
    `<meta http-equiv="Content-Security-Policy" content="script-src &#x27;self&#x27; &#x27;nonce-${nonce}&#x27;">`;

  it("replaces the build nonce on scripts that carry it, inline or not", () => {
    const html =
      meta("old") +
      `<script nonce="old">run()</script>` +
      `<script type="module" nonce="old" src="/assets/docs.js"></script>`;
    expect(rotateNonce(html, "new")).toBe(
      meta("new") +
        `<script nonce="new">run()</script>` +
        `<script type="module" nonce="new" src="/assets/docs.js"></script>`
    );
  });

  it("leaves a script with any other nonce value as it is", () => {
    const html = meta("old") + `<script nonce="guess">steal()</script>`;
    expect(rotateNonce(html, "new")).toBe(meta("new") + `<script nonce="guess">steal()</script>`);
  });

  it("does not add a nonce to a script the build left without one", () => {
    const html = meta("old") + `<script>fromContent()</script><script src="/a.js"></script>`;
    expect(rotateNonce(html, "new")).toBe(
      meta("new") + `<script>fromContent()</script><script src="/a.js"></script>`
    );
  });

  it("does not touch a data-nonce attribute", () => {
    const html = meta("old") + `<script data-nonce="old">run()</script>`;
    expect(rotateNonce(html, "new")).toBe(meta("new") + `<script data-nonce="old">run()</script>`);
  });

  it("reads an unescaped build nonce from the <meta> CSP", () => {
    const html =
      `<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'nonce-old'">` +
      `<script nonce="old">run()</script>`;
    const result = rotateNonce(html, "new");
    expect(result).toContain(`'nonce-new'`);
    expect(result).not.toContain(`'nonce-old'`);
    expect(result).toContain(`<script nonce="new">run()</script>`);
  });

  it("matches a base64 build nonce exactly", () => {
    const html =
      meta("a+b/c==") + `<script nonce="a+b/c==">run()</script><script nonce="a+b">x()</script>`;
    expect(rotateNonce(html, "new")).toBe(
      meta("new") + `<script nonce="new">run()</script><script nonce="a+b">x()</script>`
    );
  });

  it("leaves HTML without a <meta> CSP nonce unchanged", () => {
    const html = `<script nonce="old">a()</script><meta name="description" content="x">`;
    expect(rotateNonce(html, "n")).toBe(html);
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
