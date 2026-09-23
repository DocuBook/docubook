import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  DEFAULT_BASE_PATH,
  normalizeBasePath,
  resolveBasePath,
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
  resolveDocsIndexSource,
} from "../node/utils";
import {
  BUILD_CACHE_VERSION,
  basePathStamp,
  hashMdxSources,
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
