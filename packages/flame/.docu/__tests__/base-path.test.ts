import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  DEFAULT_BASE_PATH,
  normalizeBasePath,
  canonicalBasePath,
  resolveBasePath,
  resolveDeployPath,
  docsDepth,
  validateBasePath,
  docsOutDir,
  servedBasePath,
} from "../node/paths";
import { htmlShell } from "../node/html.shared";
import { buildSeoMeta } from "../node/seo";
import { buildNginxConf } from "../node/deploy.shared";
import {
  stripDocsHtmlSuffix,
  matchDocsSlug,
  rebaseContentPath,
  docsNavActive,
  docsNavHref,
} from "../node/utils";
import { resolveContentHref, resolveContentSrc } from "../node/mdx";
import { resolveDocsIndexSource } from "../node/server-utils";
import {
  BUILD_CACHE_VERSION,
  basePathStamp,
  hashMdxSources,
  prefixStamp,
  renderToolchainStamp,
} from "../node/cache-key";
import type { DocuConfig } from "../node/types";

function makeConfig(meta: Partial<DocuConfig["meta"]>): DocuConfig {
  return {
    meta: {
      title: "Test",
      description: "Test",
      baseURL: "https://example.com",
      ...meta,
    },
    navbar: { logoText: "Test", menu: [] },
    footer: { social: [] },
    repo: { url: "", path: "", edit: false },
    routes: [],
  };
}

describe("normalizeBasePath", () => {
  it("defaults to /docs when given undefined", () => {
    expect(normalizeBasePath(undefined)).toBe(DEFAULT_BASE_PATH);
    expect(normalizeBasePath(undefined)).toBe("/docs");
  });

  it("keeps a simple prefix", () => {
    expect(normalizeBasePath("/docs")).toBe("/docs");
  });

  it("treats empty string and bare slash as the deployment root", () => {
    expect(normalizeBasePath("")).toBe("");
    expect(normalizeBasePath("/")).toBe("");
  });

  it("strips leading and trailing slashes", () => {
    expect(normalizeBasePath("/repo/docs/")).toBe("/repo/docs");
    expect(normalizeBasePath("repo/docs")).toBe("/repo/docs");
    expect(normalizeBasePath("///repo///")).toBe("/repo");
  });

  it("extracts only the pathname from an absolute URL", () => {
    expect(normalizeBasePath("https://host/a/b")).toBe("/a/b");
    expect(normalizeBasePath("https://host")).toBe("");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeBasePath("  /docs  ")).toBe("/docs");
  });
});

describe("resolveBasePath", () => {
  it("uses the explicit basePath", () => {
    expect(resolveBasePath(makeConfig({ basePath: "/repo/docs" }))).toBe("/repo/docs");
  });

  it("honours an explicit empty basePath as root deployment", () => {
    // Must not fall through to the default — "" is a meaningful choice.
    expect(resolveBasePath(makeConfig({ basePath: "" }))).toBe("");
  });

  it("defaults to /docs when basePath is absent", () => {
    expect(resolveBasePath(makeConfig({}))).toBe("/docs");
  });

  it("does NOT derive from baseURL — that would double-count the path", () => {
    // Regression guard: deriving "/repo" here made buildSeoMeta append the
    // prefix to the same baseURL, producing https://host/repo/repo/...
    expect(resolveBasePath(makeConfig({ baseURL: "https://user.github.io/repo" }))).toBe("/docs");
    expect(resolveBasePath(makeConfig({ baseURL: "https://user.github.io/repo/docs" }))).toBe(
      "/docs"
    );
  });

  it("handles a missing config", () => {
    expect(resolveBasePath(null)).toBe("/docs");
    expect(resolveBasePath(undefined)).toBe("/docs");
  });
});

describe("resolveDocsIndexSource — optional docs root page", () => {
  it("returns undefined when docs/index.mdx and docs/index.md are absent", () => {
    expect(resolveDocsIndexSource("/path/that/does/not/exist")).toBeUndefined();
  });
});

describe("optional docs root index output", () => {
  it("removes stale docs index output when the source is absent", () => {
    const distDir = ".docu/dist";
    const outputDir = docsOutDir(distDir, "/docs");
    const docsIndexPath = `${outputDir}/index.html`;
    const shouldRemoveStaleIndex =
      !resolveDocsIndexSource("/missing/docs") && outputDir !== distDir;

    expect(shouldRemoveStaleIndex).toBe(true);
    expect(docsIndexPath).toBe(".docu/dist/docs/index.html");
  });

  it("preserves the landing index when basePath is the deployment root", () => {
    const distDir = ".docu/dist";
    const outputDir = docsOutDir(distDir, "");
    expect(outputDir).toBe(distDir);
  });
});

describe("docsOutDir", () => {
  it("nests pages under the prefix", () => {
    expect(docsOutDir(".docu/dist", "/docs")).toBe(".docu/dist/docs");
    expect(docsOutDir(".docu/dist", "/repo/docs")).toBe(".docu/dist/repo/docs");
  });

  it("puts pages at the dist root when the prefix is empty", () => {
    expect(docsOutDir(".docu/dist", "")).toBe(".docu/dist");
  });
});

describe("servedBasePath", () => {
  it("returns the resolved prefix", () => {
    expect(servedBasePath()).toBe("/docs");
  });
});

describe("htmlShell — basePath", () => {
  const OPTS = {
    title: "T",
    description: "D",
    body: "<p>x</p>",
    favicon: "/favicon.ico",
    css: "site-abc.css",
    js: "client-abc.js",
  };

  it("keeps absolute assets at the dist root — the bundle tree, not the docs prefix", () => {
    // Hash-named bundles are written to the dist root (/assets/) regardless of
    // the docs prefix; `<prefix>/assets/` only holds user content assets.
    const html = htmlShell({ ...OPTS, absoluteAssets: true, basePath: "/repo/docs" });
    expect(html).toContain('href="/assets/site-abc.css"');
    expect(html).toContain('src="/assets/client-abc.js"');
  });

  it("re-bases author-written content paths onto the configured prefix", () => {
    const favicon = "/docs/assets/images/favicon.ico";
    const html = htmlShell({ ...OPTS, favicon, basePath: "/repo" });
    expect(html).toContain('href="repo/assets/images/favicon.ico"');
    const nested = htmlShell({ ...OPTS, favicon, basePath: "/repo", depth: 2 });
    expect(nested).toContain('href="../../repo/assets/images/favicon.ico"');
  });

  it("collapses the default /docs prefix onto the deployment root", () => {
    const html = htmlShell({ ...OPTS, favicon: "/docs/assets/images/favicon.ico", basePath: "" });
    expect(html).toContain('href="assets/images/favicon.ico"');
  });

  it("keeps root-absolute assets unprefixed at the deployment root", () => {
    const html = htmlShell({ ...OPTS, absoluteAssets: true, basePath: "" });
    expect(html).toContain('href="/assets/site-abc.css"');
    expect(html).toContain('src="/assets/client-abc.js"');
  });

  it("defaults to unprefixed when basePath is omitted (no regression)", () => {
    const html = htmlShell({ ...OPTS, absoluteAssets: true });
    expect(html).toContain('href="/assets/site-abc.css"');
  });

  it("leaves depth-relative assets relative — they already climb to the root", () => {
    const html = htmlShell({ ...OPTS, depth: 2, basePath: "/repo/docs" });
    expect(html).toContain('href="../../assets/site-abc.css"');
    expect(html).not.toContain("/repo/docs/assets/site-abc.css");
  });
});

describe("buildSeoMeta — basePath", () => {
  it("prefixes canonical urls with the configured prefix", () => {
    const config = makeConfig({ baseURL: "https://docubook.pro" });
    expect(buildSeoMeta(config, {}, "getting-started/overview").url).toBe(
      "https://docubook.pro/docs/getting-started/overview"
    );
  });

  it("builds correct urls for a GitHub Pages project site", () => {
    const config = makeConfig({ baseURL: "https://user.github.io", basePath: "/repo" });
    expect(buildSeoMeta(config, {}, "intro").url).toBe("https://user.github.io/repo/intro");
  });

  it("omits the prefix entirely for a root deployment", () => {
    const config = makeConfig({ baseURL: "https://x.dev", basePath: "" });
    expect(buildSeoMeta(config, {}, "intro").url).toBe("https://x.dev/intro");
  });

  it("never emits a doubled prefix", () => {
    const config = makeConfig({ baseURL: "https://user.github.io", basePath: "/repo" });
    const { url } = buildSeoMeta(config, {}, "a/b");
    expect(url).toBe("https://user.github.io/repo/a/b");
    expect(url).not.toContain("/repo/repo/");
    expect(url).not.toContain("/docs/docs/");
  });

  it("resolves a root-relative OG image against baseURL", () => {
    const config = makeConfig({ basePath: "/repo" });
    const result = buildSeoMeta(config, { image: "/repo/assets/og.png" }, "intro");
    expect(result.image).toBe("https://example.com/repo/assets/og.png");
  });

  it("resolves a relative OG image against baseURL + prefix", () => {
    const config = makeConfig({ basePath: "/repo" });
    const result = buildSeoMeta(config, { image: "custom-og.png" }, "intro");
    expect(result.image).toBe("https://example.com/repo/custom-og.png");
  });
});

describe("buildNginxConf — basePath", () => {
  it("emits the content-assets block under the configured prefix", () => {
    expect(buildNginxConf("/repo")).toContain("location /repo/assets/");
    expect(buildNginxConf("/repo/docs")).toContain("location /repo/docs/assets/");
  });

  it("keeps the hash-bundle block at the deployment root", () => {
    const conf = buildNginxConf("/repo");
    expect(conf).toContain("location /assets/");
    expect(conf).toContain("location = /assets/search-index.json");
  });

  it("preserves the historical /docs config exactly", () => {
    expect(buildNginxConf("/docs")).toContain("location /docs/assets/");
  });

  it("does not emit duplicate location blocks at the root", () => {
    // nginx refuses to start on duplicate locations; at basePath "" the bundle
    // and content asset trees collapse onto /assets/.
    const conf = buildNginxConf("");
    const locations = [...conf.matchAll(/location [^\n{]*/g)].map((m) => m[0].trim());
    expect(locations.length).toBeGreaterThan(0);
    expect(new Set(locations).size).toBe(locations.length);
  });

  it("produces balanced braces for every prefix", () => {
    for (const bp of ["/docs", "/repo", "/repo/docs", ""]) {
      const conf = buildNginxConf(bp);
      const open = (conf.match(/\{/g) || []).length;
      const close = (conf.match(/\}/g) || []).length;
      expect(open).toBe(close);
    }
  });

  it("omits the content-assets block for prefixes nginx cannot express", () => {
    // A space in a location name would fail `nginx -t`; the block is skipped
    // so the container still starts (assets are served by the default
    // location, without the 7d cache headers).
    const conf = buildNginxConf("/my docs");
    expect(conf).not.toContain("location /my docs/assets/");
    expect(conf).toContain("location /assets/");
  });
});

describe("stripDocsHtmlSuffix — basePath", () => {
  it("normalizes /docs html requests by default", () => {
    expect(stripDocsHtmlSuffix("/docs/getting-started.html")).toBe("/docs/getting-started");
  });

  it("follows a configured prefix", () => {
    expect(stripDocsHtmlSuffix("/repo/guides/install.html", "/repo")).toBe("/repo/guides/install");
  });

  it("maps the directory-index edge case for the active prefix", () => {
    expect(stripDocsHtmlSuffix("/repo.html", "/repo")).toBe("/repo");
    expect(stripDocsHtmlSuffix("/docs.html", "/docs")).toBe("/docs");
  });

  it("leaves non-docs and extensionless paths untouched", () => {
    expect(stripDocsHtmlSuffix("/404.html")).toBe("/404.html");
    expect(stripDocsHtmlSuffix("/assets/app.js")).toBe("/assets/app.js");
    expect(stripDocsHtmlSuffix("/docs")).toBe("/docs");
  });

  it("does not strip under an unrelated prefix", () => {
    expect(stripDocsHtmlSuffix("/docs/page.html", "/repo")).toBe("/docs/page.html");
  });

  it("only maps the root index for a root deployment", () => {
    expect(stripDocsHtmlSuffix("/index.html", "")).toBe("/");
    expect(stripDocsHtmlSuffix("/guide.html", "")).toBe("/guide.html");
  });
});

describe("matchDocsSlug — request → slug", () => {
  it("matches the default /docs prefix", () => {
    expect(matchDocsSlug("/docs", "/docs")).toEqual([]);
    expect(matchDocsSlug("/docs/", "/docs")).toEqual([]);
    expect(matchDocsSlug("/docs/guides/install", "/docs")).toEqual(["guides", "install"]);
  });

  it("follows a configured prefix", () => {
    expect(matchDocsSlug("/repo", "/repo")).toEqual([]);
    expect(matchDocsSlug("/repo/a/b", "/repo")).toEqual(["a", "b"]);
  });

  it("rejects paths outside the prefix", () => {
    expect(matchDocsSlug("/", "/repo")).toBeNull();
    expect(matchDocsSlug("/about", "/repo")).toBeNull();
    expect(matchDocsSlug("/docs/page", "/repo")).toBeNull();
    // Must not treat a longer sibling path as a child of the prefix.
    expect(matchDocsSlug("/repository/page", "/repo")).toBeNull();
  });

  it("owns the whole domain at a root deployment", () => {
    expect(matchDocsSlug("/", "")).toEqual([]);
    expect(matchDocsSlug("/guides", "")).toEqual(["guides"]);
    expect(matchDocsSlug("/guides/install", "")).toEqual(["guides", "install"]);
  });

  it("declines trailing-slash paths at the root so assets still resolve", () => {
    // `/assets/` must fall through to serveStatic rather than becoming a slug.
    expect(matchDocsSlug("/assets/", "")).toBeNull();
  });
});

describe("base path cache invalidation", () => {
  // The bug this guards: the page cache is keyed by relative MDX path and the
  // bundle key is hashed from MDX source alone. Neither changes when only
  // meta.basePath changes, so without a base-path stamp the build would skip
  // every page and keep serving HTML that points at the old prefix.
  const SOURCES = { "getting-started/intro": "export default function MDXContent(){}" };

  it("folds the resolved base path into the bundle hash", () => {
    expect(basePathStamp()).toBe("/docs");
    expect(hashMdxSources(SOURCES)).toMatch(/^[a-f0-9]{16}$/);
  });

  it("produces a stable hash for identical inputs", () => {
    expect(hashMdxSources(SOURCES)).toBe(hashMdxSources(SOURCES));
  });

  it("changes the hash when page content changes", () => {
    const changed = { "getting-started/intro": "export default function MDXContent(){/*x*/}" };
    expect(hashMdxSources(changed)).not.toBe(hashMdxSources(SOURCES));
  });

  it("is sensitive to key order-independent input", () => {
    const a = { a: "1", b: "2" };
    const b = { b: "2", a: "1" };
    expect(hashMdxSources(a)).toBe(hashMdxSources(b));
  });

  it("cache version was bumped for the base-path change", () => {
    // v6 introduced base-path aware output; an older cache must not be trusted.
    expect(BUILD_CACHE_VERSION).toBeGreaterThanOrEqual(6);
  });

  it("exposes the resolved prefix as part of the key material", () => {
    // Guards against someone dropping basePathStamp() from the hash inputs.
    const src = readFileSync(new URL("../node/cache-key.ts", import.meta.url), "utf-8");
    expect(src).toContain("basePathStamp()");
    expect(src).toMatch(/hashMdxSources[\s\S]*basePathStamp\(\)/);
  });

  it("folds the deployment path into the same key material", () => {
    // A `meta.baseURL` path change shifts every root-absolute URL, so it has to
    // invalidate the cache alongside `meta.basePath` — otherwise a warm cache
    // keeps serving HTML built for the previous deployment root.
    expect(prefixStamp("/docs", "")).toBe("/docs");
    expect(prefixStamp("/docs", "/repo")).toBe("/docs@/repo");
    expect(prefixStamp("", "/repo")).toBe("/@/repo");
    expect(basePathStamp()).toBe(prefixStamp("/docs", ""));
  });
});

describe("render toolchain stamp", () => {
  // The bug this guards: page cache entries are keyed by MDX source alone, so
  // editing the renderer (template, meta tag, base-path plumbing) left every
  // page a cache hit and kept serving HTML built by the old framework code.
  // Observed for real: after fixing og:image/favicon handling the build still
  // reported "26 cached" and emitted the stale paths until --force.
  it("is a stable hex fingerprint", () => {
    expect(renderToolchainStamp()).toMatch(/^[a-f0-9]{16}$/);
    expect(renderToolchainStamp()).toBe(renderToolchainStamp());
  });

  it("covers the framework sources that shape rendered HTML", () => {
    const src = readFileSync(new URL("../node/cache-key.ts", import.meta.url), "utf-8");
    for (const file of ["html.ts", "html.shared.ts", "seo.ts", "utils.ts", "paths.ts"]) {
      expect(src).toContain(file);
    }
  });

  it("folds the stamp into the bundle/content hash", () => {
    const src = readFileSync(new URL("../node/cache-key.ts", import.meta.url), "utf-8");
    expect(src).toMatch(/hashMdxSources[\s\S]*renderToolchainStamp\(\)/);
  });

  it("is recorded in and compared against the cache metadata", () => {
    for (const file of ["../node/build.ts", "../node/build.impl.ts"]) {
      const src = readFileSync(new URL(file, import.meta.url), "utf-8");
      expect(src).toMatch(/meta\.render !== renderToolchainStamp\(\)/);
      expect(src).toMatch(/render: renderToolchainStamp\(\)/);
    }
  });
});

describe("rebaseContentPath — author-written content paths", () => {
  // Authors write asset paths as they appear on disk, e.g.
  // "/docs/assets/images/og.png". After a prefix change those paths must be
  // rewritten or the asset 404s at the old URL. This was a real regression:
  // og:image and the favicon kept pointing at /docs after basePath changed.
  it("rewrites a default /docs path onto the configured prefix", () => {
    expect(rebaseContentPath("/docs/assets/images/og.png", "/repo")).toBe(
      "/repo/assets/images/og.png"
    );
    expect(rebaseContentPath("/docs/assets/images/favicon.ico", "/repo/docs")).toBe(
      "/repo/docs/assets/images/favicon.ico"
    );
  });

  it("rewrites the bare prefix with no trailing path", () => {
    expect(rebaseContentPath("/docs", "/repo")).toBe("/repo");
  });

  it("leaves a path that already carries the prefix untouched", () => {
    expect(rebaseContentPath("/repo/assets/x.png", "/repo")).toBe("/repo/assets/x.png");
  });

  it("leaves unrelated and non-prefixed paths untouched", () => {
    expect(rebaseContentPath("/assets/x.png", "/repo")).toBe("/assets/x.png");
    // Must not rewrite a longer sibling path that merely starts with the string.
    expect(rebaseContentPath("/docsomething/x.png", "/repo")).toBe("/docsomething/x.png");
  });

  it("collapses the default /docs prefix at a root deployment", () => {
    // Content assets are copied to <dist>/assets/ at a root deployment, so an
    // authored /docs path must shed the stale prefix or it 404s.
    expect(rebaseContentPath("/docs/assets/images/og.png", "")).toBe("/assets/images/og.png");
    expect(rebaseContentPath("/about/x", "")).toBe("/about/x");
  });

  it("is a no-op when the prefix is unchanged (the default)", () => {
    expect(rebaseContentPath("/docs/a.png", "/docs")).toBe("/docs/a.png");
  });
});

describe("buildSeoMeta — og:image rebasing", () => {
  it("re-bases an author-written /docs og:image onto the prefix", () => {
    const config = makeConfig({ basePath: "/repo", ogImage: "/docs/assets/images/og.png" });
    expect(buildSeoMeta(config, {}, "intro").image).toBe(
      "https://example.com/repo/assets/images/og.png"
    );
  });

  it("leaves the default /docs og:image alone", () => {
    const config = makeConfig({ ogImage: "/docs/assets/images/og.png" });
    expect(buildSeoMeta(config, {}, "intro").image).toBe(
      "https://example.com/docs/assets/images/og.png"
    );
  });

  it("passes an absolute og:image through unchanged", () => {
    const config = makeConfig({ basePath: "/repo" });
    const result = buildSeoMeta(config, { image: "https://cdn.test/a.png" }, "intro");
    expect(result.image).toBe("https://cdn.test/a.png");
  });
});

describe("backward compatibility", () => {
  it("config without basePath reproduces the /docs defaults", () => {
    const config = makeConfig({ baseURL: "https://docubook.pro" });
    expect(resolveBasePath(config)).toBe("/docs");
    expect(docsOutDir(".docu/dist", resolveBasePath(config))).toBe(".docu/dist/docs");
    expect(buildSeoMeta(config, {}, "intro").url).toBe("https://docubook.pro/docs/intro");
    expect(buildNginxConf(resolveBasePath(config))).toContain("location /docs/assets/");
  });

  it("defaults to the exported constant", () => {
    expect(DEFAULT_BASE_PATH).toBe("/docs");
  });
});

describe("docsDepth — relative climb to the dist root", () => {
  it("reproduces the historical formula for a single-segment prefix", () => {
    // Output-stability guard: pages used to compute slug.split("/").length.
    expect(docsDepth("getting-started/overview")).toBe(2);
    expect(docsDepth("overview")).toBe(1);
    expect(docsDepth("")).toBe(1);
  });

  it("climbs through every segment of a nested prefix", () => {
    expect(docsDepth("guide/routing", "/repo/docs")).toBe(3);
    expect(docsDepth("", "/repo/docs")).toBe(2);
  });

  it("counts only the page directories at a root deployment", () => {
    // A host that serves the dist from a subpath (GitHub Pages project site)
    // shares that segment between pages and assets, so it cancels out.
    expect(docsDepth("guide/routing", "")).toBe(1);
    expect(docsDepth("", "")).toBe(0);
  });

  it("tolerates stray slashes in the slug", () => {
    expect(docsDepth("/guide/routing/", "/repo")).toBe(2);
  });
});

describe("resolveDeployPath — host-contributed deployment root", () => {
  it("is empty for an origin root", () => {
    expect(resolveDeployPath(makeConfig({ baseURL: "https://docubook.pro" }))).toBe("");
    expect(resolveDeployPath(makeConfig({ baseURL: "http://localhost:3000" }))).toBe("");
  });

  it("reads the path of a GitHub Pages project site", () => {
    expect(resolveDeployPath(makeConfig({ baseURL: "https://user.github.io/repo" }))).toBe("/repo");
    expect(resolveDeployPath(makeConfig({ baseURL: "https://user.github.io/repo/" }))).toBe(
      "/repo"
    );
    expect(resolveDeployPath(makeConfig({ baseURL: "https://host/a/b" }))).toBe("/a/b");
  });

  it("accepts a root-relative baseURL", () => {
    expect(resolveDeployPath(makeConfig({ baseURL: "/preview" }))).toBe("/preview");
  });

  it("ignores a scheme-less hostname — a baseURL mistake, not a prefix", () => {
    expect(resolveDeployPath(makeConfig({ baseURL: "user.github.io/repo" }))).toBe("");
  });

  it("handles a missing config", () => {
    expect(resolveDeployPath(null)).toBe("");
    expect(resolveDeployPath(undefined)).toBe("");
  });
});

describe("canonicalBasePath — normalization", () => {
  it("lowercases every segment", () => {
    expect(canonicalBasePath("/Docs")).toBe("/docs");
    expect(canonicalBasePath("/DOCS")).toBe("/docs");
    expect(canonicalBasePath("/Repo/Docs")).toBe("/repo/docs");
  });

  it("folds whitespace into dashes", () => {
    expect(canonicalBasePath("/docs me")).toBe("/docs-me");
    expect(canonicalBasePath("/my docs/v2")).toBe("/my-docs/v2");
  });

  it("drops characters a static host cannot serve", () => {
    expect(canonicalBasePath("/docs%20me")).toBe("/docs20me");
  });

  it("collapses duplicate separators and is idempotent", () => {
    expect(canonicalBasePath("/docs--me")).toBe("/docs-me");
    expect(canonicalBasePath("/repo//docs")).toBe("/repo/docs");
    expect(canonicalBasePath(canonicalBasePath("/Docs me"))).toBe("/docs-me");
  });

  it("returns empty when nothing servable remains, or for root forms", () => {
    expect(canonicalBasePath("%%%")).toBe("");
    expect(canonicalBasePath("/")).toBe("");
    expect(canonicalBasePath("")).toBe("");
  });

  it("drops dot segments so a prefix cannot escape the dist", () => {
    expect(canonicalBasePath("/..")).toBe("");
    expect(canonicalBasePath("/./docs")).toBe("/docs");
    expect(canonicalBasePath("/a/../b")).toBe("/a/b");
    expect(resolveBasePath(makeConfig({ basePath: "/.." }))).toBe(DEFAULT_BASE_PATH);
    // The prefix is also an output directory: `join(dist, "..")` would climb out.
    expect(docsOutDir(".docu/dist", canonicalBasePath("/.."))).toBe(".docu/dist");
  });

  it("is what resolveBasePath hands to the rest of the build", () => {
    expect(resolveBasePath(makeConfig({ basePath: "/DOCS" }))).toBe("/docs");
    expect(resolveBasePath(makeConfig({ basePath: "/docs me" }))).toBe("/docs-me");
    expect(resolveBasePath(makeConfig({ basePath: "/Repo/Docs/" }))).toBe("/repo/docs");
  });

  it("keeps root deployments at the root", () => {
    expect(resolveBasePath(makeConfig({ basePath: "/" }))).toBe("");
    expect(resolveBasePath(makeConfig({ basePath: "///" }))).toBe("");
  });

  it("falls back to the default when the value is unsalvageable", () => {
    // Silently turning garbage into a root deployment would move every page.
    expect(resolveBasePath(makeConfig({ basePath: "%%%" }))).toBe(DEFAULT_BASE_PATH);
  });

  it("never touches the host's deployment path — case matters there", () => {
    expect(resolveDeployPath(makeConfig({ baseURL: "https://user.github.io/Docs" }))).toBe("/Docs");
  });
});

describe("validateBasePath — normalization guard", () => {
  it("stays quiet for canonical values and root forms", () => {
    expect(validateBasePath(undefined)).toEqual([]);
    expect(validateBasePath("/docs")).toEqual([]);
    expect(validateBasePath("/repo/docs")).toEqual([]);
    expect(validateBasePath("")).toEqual([]);
    expect(validateBasePath("/")).toEqual([]);
    expect(validateBasePath("   ")).toEqual([]);
  });

  it("rejects non-strings — nothing can normalize them", () => {
    const issues = validateBasePath(null);
    expect(issues).toHaveLength(1);
    expect(issues[0].level).toBe("error");
    expect(issues[0].message).toContain("null");
    expect(issues[0].message).toContain(DEFAULT_BASE_PATH);
    expect(validateBasePath(42)[0].level).toBe("error");
  });

  it("warns about whitespace and names the canonical value", () => {
    const issues = validateBasePath("/docs me");
    expect(issues).toHaveLength(1);
    expect(issues[0].level).toBe("warning");
    expect(issues[0].message).toContain("whitespace");
    expect(issues[0].message).toContain("/docs-me");
    expect(validateBasePath("/my docs/v2")[0].message).toContain("/my-docs/v2");
  });

  it("warns about characters that need percent-encoding", () => {
    const issues = validateBasePath("/docs%20me");
    expect(issues[0].level).toBe("warning");
    expect(issues[0].message).toContain("percent-encoding");
    expect(issues[0].message).toContain("%");
  });

  it("warns about uppercase without blocking the build", () => {
    const issues = validateBasePath("/DOCS");
    expect(issues).toHaveLength(1);
    expect(issues[0].level).toBe("warning");
    expect(issues[0].message).toContain("non-lowercase");
    expect(issues[0].message).toContain("/docs");
  });

  it("packs every reason into one warning", () => {
    const issues = validateBasePath("/Docs me");
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("whitespace");
    expect(issues[0].message).toContain("non-lowercase");
    expect(issues[0].message).toContain("/docs-me");
  });

  it("warns instead of silently choosing the root when nothing is servable", () => {
    const issues = validateBasePath("%%%");
    expect(issues).toHaveLength(1);
    expect(issues[0].level).toBe("warning");
    expect(issues[0].message).toContain(DEFAULT_BASE_PATH);
  });

  it("warns about dot segments and names the collapsed result", () => {
    const issues = validateBasePath("/a/../b");
    expect(issues).toHaveLength(1);
    expect(issues[0].level).toBe("warning");
    expect(issues[0].message).toContain("dot segments");
    expect(issues[0].message).toContain("/a/b");
  });
});

describe("resolveContentHref / resolveContentSrc — authored content paths", () => {
  it("leaves the default deployment byte-identical", () => {
    expect(resolveContentHref("/docs/guide/routing", "/docs", "")).toBe("/docs/guide/routing.html");
    expect(resolveContentHref("/docs/guide/routing.html", "/docs", "")).toBeNull();
    expect(resolveContentHref("/docs/guide/routing#setup", "/docs", "")).toBeNull();
    expect(resolveContentSrc("/docs/assets/img.png", "/docs", "")).toBeNull();
  });

  it("leaves paths outside the docs site alone", () => {
    expect(resolveContentHref("/app/dashboard", "/docs", "")).toBeNull();
    expect(resolveContentSrc("/favicon.ico", "/docs", "")).toBeNull();
    expect(resolveContentHref("https://example.com/docs/x", "/docs", "")).toBeNull();
    expect(resolveContentSrc("//cdn.example.com/x.js", "/docs", "")).toBeNull();
    expect(resolveContentHref("#install", "/docs", "")).toBeNull();
  });

  it("re-bases authored paths onto another prefix", () => {
    expect(resolveContentHref("/docs/guide/routing", "/repo", "")).toBe("/repo/guide/routing.html");
    expect(resolveContentHref("/docs", "/repo", "")).toBe("/repo");
    expect(resolveContentSrc("/docs/assets/img.png", "/repo", "")).toBe("/repo/assets/img.png");
  });

  it("collapses the authored prefix at a root deployment", () => {
    expect(resolveContentHref("/docs/guide/routing", "", "")).toBe("/guide/routing.html");
    expect(resolveContentHref("/docs", "", "")).toBe("/");
    expect(resolveContentSrc("/docs/assets/img.png", "", "")).toBe("/assets/img.png");
  });

  it("adds the host's deployment path for project sites", () => {
    expect(resolveContentSrc("/docs/assets/img.png", "", "/Docs")).toBe("/Docs/assets/img.png");
    expect(resolveContentHref("/docs/guide/routing", "", "/Docs")).toBe("/Docs/guide/routing.html");
    expect(resolveContentHref("/guide/routing", "", "/Docs")).toBe("/Docs/guide/routing.html");
  });

  it("keeps fragments, files and query strings intact", () => {
    expect(resolveContentHref("/docs/guide/routing#setup", "", "")).toBe("/guide/routing#setup");
    expect(resolveContentHref("/docs/assets/report.pdf", "", "")).toBe("/assets/report.pdf");
    expect(resolveContentSrc("/docs/assets/img.png?v=2", "", "")).toBe("/assets/img.png?v=2");
  });

  it("applies the historical docs-own-the-root rule at a root deployment", () => {
    // Content keeps the pre-existing rule (any in-site path is a candidate),
    // while nav links stay gated to the docs prefix — see docsNavHref.
    expect(resolveContentHref("/getting-started/overview", "", "")).toBe(
      "/getting-started/overview.html"
    );
    expect(docsNavHref("/getting-started/overview", "")).toBe("/getting-started/overview");
  });
});

describe("buildSeoMeta — og:image under a host path", () => {
  it("keeps the deployment path in the image URL", () => {
    const config = makeConfig({
      baseURL: "https://user.github.io/Docs",
      basePath: "",
      ogImage: "/docs/assets/images/og.png",
    });
    expect(buildSeoMeta(config, {}, "intro").image).toBe(
      "https://user.github.io/Docs/assets/images/og.png"
    );
  });

  it("resolves a relative image against the deployment root", () => {
    const config = makeConfig({
      baseURL: "https://user.github.io/Docs",
      basePath: "",
      ogImage: "og.png",
    });
    expect(buildSeoMeta(config, {}, "intro").image).toBe("https://user.github.io/Docs/og.png");
  });

  it("does not repeat a deployment path the author already wrote", () => {
    const config = makeConfig({
      baseURL: "https://user.github.io/Docs",
      basePath: "",
      ogImage: "/Docs/assets/images/og.png",
    });
    expect(buildSeoMeta(config, {}, "intro").image).toBe(
      "https://user.github.io/Docs/assets/images/og.png"
    );
  });
});

describe("docsNavHref — authored nav links", () => {
  it("suffixes docs pages with .html under the default prefix", () => {
    expect(docsNavHref("/docs/guide/routing")).toBe("/docs/guide/routing.html");
    expect(docsNavHref("/docs/guide/routing.html")).toBe("/docs/guide/routing.html");
  });

  it("keeps the docs root as a directory index", () => {
    expect(docsNavHref("/docs")).toBe("/docs");
    expect(docsNavHref("/docs/")).toBe("/docs");
    expect(docsNavHref("/")).toBe("/");
  });

  it("re-bases onto another prefix", () => {
    expect(docsNavHref("/docs", "/repo")).toBe("/repo");
    expect(docsNavHref("/docs/guide/routing", "/repo")).toBe("/repo/guide/routing.html");
  });

  it("collapses the authored prefix at a root deployment", () => {
    expect(docsNavHref("/docs", "")).toBe("/");
    expect(docsNavHref("/docs/guide/routing", "")).toBe("/guide/routing.html");
  });

  it("passes external, hash and relative links through", () => {
    expect(docsNavHref("https://github.com/x")).toBe("https://github.com/x");
    expect(docsNavHref("//cdn.example.com/x")).toBe("//cdn.example.com/x");
    expect(docsNavHref("#install")).toBe("#install");
    expect(docsNavHref("mailto:hi@x.dev")).toBe("mailto:hi@x.dev");
  });

  it("keeps query strings and fragments attached to the page URL", () => {
    expect(docsNavHref("/docs/guide/routing#middleware")).toBe(
      "/docs/guide/routing.html#middleware"
    );
    expect(docsNavHref("/docs/guide/routing?tab=1#x")).toBe("/docs/guide/routing.html?tab=1#x");
  });

  it("leaves non-HTML files alone", () => {
    expect(docsNavHref("/docs/feed.xml")).toBe("/docs/feed.xml");
  });

  it("preserves root-relative routes outside the docs prefix", () => {
    // Sibling routes on the same origin are not docs pages: suffixing them (or
    // re-basing them) would break navigation to an app, a status page, etc.
    expect(docsNavHref("/app/dashboard", "/docs")).toBe("/app/dashboard");
    expect(docsNavHref("/app/dashboard", "/repo")).toBe("/app/dashboard");
    expect(docsNavHref("/status", "/repo")).toBe("/status");
    // A longer sibling that merely starts with the prefix text.
    expect(docsNavHref("/docs-extra/page", "/repo")).toBe("/docs-extra/page");
    // At a root deployment nav links stay gated too — author them under the
    // `/docs` prefix, which is the path this resolver re-bases.
    expect(docsNavHref("/getting-started/overview", "")).toBe("/getting-started/overview");
  });
});

describe("docsNavActive — nav link matching", () => {
  it("accepts both the generated and the typed form", () => {
    expect(docsNavActive("/docs/guide/routing.html", "/docs/guide/routing.html")).toBe(true);
    expect(docsNavActive("/docs/guide/routing", "/docs/guide/routing.html")).toBe(true);
    expect(docsNavActive("/docs/guide/routing/extra", "/docs/guide/routing.html")).toBe(true);
  });

  it("ignores unrelated paths", () => {
    expect(docsNavActive("/docs/guide/orm.html", "/docs/guide/routing.html")).toBe(false);
    expect(docsNavActive("/docs", "/docs/guide/routing.html")).toBe(false);
  });
});

describe("htmlShell — deployPath", () => {
  const OPTS = {
    title: "T",
    description: "D",
    body: "<p>x</p>",
    favicon: "/favicon.ico",
    css: "site-abc.css",
    js: "client-abc.js",
  };

  it("prefixes root-absolute assets with the host's deployment path", () => {
    const html = htmlShell({ ...OPTS, absoluteAssets: true, basePath: "", deployPath: "/repo" });
    expect(html).toContain('href="/repo/assets/site-abc.css"');
    expect(html).toContain('src="/repo/assets/client-abc.js"');
  });

  it("re-bases the favicon under the deployment path too", () => {
    const html = htmlShell({
      ...OPTS,
      absoluteAssets: true,
      basePath: "",
      deployPath: "/repo",
      favicon: "/docs/assets/images/favicon.ico",
    });
    expect(html).toContain('href="/repo/assets/images/favicon.ico"');
  });

  it("leaves relative assets alone — they already climb out of the deployment path", () => {
    const html = htmlShell({ ...OPTS, depth: 1, basePath: "", deployPath: "/repo" });
    expect(html).toContain('href="../assets/site-abc.css"');
    expect(html).not.toContain("/repo/assets/site-abc.css");
  });
});
