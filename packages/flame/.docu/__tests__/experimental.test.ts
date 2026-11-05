import { describe, it, expect, afterEach } from "vitest";
import { readFileSync, existsSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  resolveOwnPages,
  validateOwnPages,
  resolveRootRoute,
  resolveBundlePath,
  resolveNotFoundPath,
  needsStandaloneRoot,
  redirectHtml,
  STANDALONE_ENV,
} from "../node/experimental";
import {
  ownPages,
  assertValidExperimental,
  basePath,
  bundlePath,
  notFoundPath,
  standaloneRoot,
  ASSETS_DIR,
  DIST_DIR,
  cleanRootBundlesIn,
} from "../node/paths";
import { ownPagesStamp, basePathStamp, prefixStamp, RENDER_SOURCE_FILES } from "../node/cache-key";
import { redirectResponse } from "../node/server-utils";
import { htmlShell } from "../node/html.shared";
import {
  buildNginxConf,
  buildHeadersFile,
  HEADERS_FILE,
  nginxConfIsStale,
  workflowIsStandalone,
} from "../node/deploy.shared";
import type { DocuConfig } from "../node/types";

const read = (rel: string) => readFileSync(new URL(`../node/${rel}`, import.meta.url), "utf-8");

/** Minimal config; `overrides` is untyped so malformed `experimental` values can be fed in. */
function config(overrides: Record<string, unknown>): DocuConfig {
  return {
    meta: { title: "T", description: "", baseURL: "https://t.dev" },
    navbar: { logoText: "T", menu: [] },
    footer: { social: [] },
    repo: { url: "", path: "", edit: false },
    routes: [],
    ...overrides,
  } as unknown as DocuConfig;
}

describe("experimental.pages — resolveOwnPages", () => {
  it("defaults to off: no config, no section, no key", () => {
    expect(resolveOwnPages(undefined)).toBe(false);
    expect(resolveOwnPages(null)).toBe(false);
    expect(resolveOwnPages(config({}))).toBe(false);
    expect(resolveOwnPages(config({ experimental: {} }))).toBe(false);
  });

  it("is on only for a literal true", () => {
    expect(resolveOwnPages(config({ experimental: { pages: true } }))).toBe(true);
    expect(resolveOwnPages(config({ experimental: { pages: false } }))).toBe(false);
    // Truthy non-booleans are config mistakes, reported by validateOwnPages —
    // they must not silently turn the landing page off.
    expect(resolveOwnPages(config({ experimental: { pages: "true" } }))).toBe(false);
    expect(resolveOwnPages(config({ experimental: { pages: 1 } }))).toBe(false);
  });

  it("reads the flame docu.json default through the config singleton", () => {
    // This repository's own docs ship the generated landing page.
    expect(ownPages()).toBe(false);
    expect(assertValidExperimental()).toEqual([]);
  });
});

describe("experimental.pages — validateOwnPages", () => {
  it("accepts an absent section and a boolean flag", () => {
    expect(validateOwnPages(config({}))).toEqual([]);
    expect(validateOwnPages(config({ experimental: { pages: true } }))).toEqual([]);
    expect(validateOwnPages(config({ experimental: { pages: false } }))).toEqual([]);
  });

  it("rejects a section that is not an object", () => {
    for (const bad of [null, true, "pages", [], 3]) {
      const issues = validateOwnPages(config({ experimental: bad }));
      expect(issues).toHaveLength(1);
      expect(issues[0]!.level).toBe("error");
      expect(issues[0]!.message).toContain('"experimental" must be an object');
    }
  });

  it("rejects a non-boolean pages value and names what it got", () => {
    const issues = validateOwnPages(config({ experimental: { pages: "true" } }));
    expect(issues).toEqual([
      { level: "error", message: '"experimental.pages" must be a boolean (got string)' },
    ]);
    expect(validateOwnPages(config({ experimental: { pages: null } }))[0]!.message).toContain(
      "got null"
    );
  });

  it("warns that `home` is ignored once the flag is on", () => {
    const issues = validateOwnPages(
      config({ experimental: { pages: true }, home: { hero: { headline: "Hi" } } })
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]!.level).toBe("warning");
    expect(issues[0]!.message).toContain('"home" section of docu.json is ignored');
  });

  it("warns when the flag meets a root basePath, naming the authored value", () => {
    for (const basePath of ["", "/", "///"]) {
      const issues = validateOwnPages(
        config({ experimental: { pages: true }, meta: { title: "T", basePath } })
      );
      expect(issues, JSON.stringify(basePath)).toHaveLength(1);
      expect(issues[0]!.level).toBe("warning");
      expect(issues[0]!.message).toContain(`root "meta.basePath" (${JSON.stringify(basePath)})`);
      expect(issues[0]!.message).toContain("cannot share the origin with your own app");
      expect(issues[0]!.message).toContain('"/docs"');
    }
  });

  it("does not warn about the basePath with a prefix or while the flag is off", () => {
    for (const basePath of ["/docs", "docs", "/handbook/v2", undefined]) {
      const meta = basePath === undefined ? { title: "T" } : { title: "T", basePath };
      expect(validateOwnPages(config({ experimental: { pages: true }, meta }))).toEqual([]);
    }
    for (const basePath of ["", "/", " "]) {
      expect(
        validateOwnPages(config({ experimental: { pages: false }, meta: { title: "T", basePath } }))
      ).toEqual([]);
      expect(validateOwnPages(config({ meta: { title: "T", basePath } }))).toEqual([]);
    }
  });

  it("reports both warnings when `home` and a root basePath come together", () => {
    const issues = validateOwnPages(
      config({
        experimental: { pages: true },
        meta: { title: "T", basePath: "/" },
        home: { hero: { headline: "Hi" } },
      })
    );
    expect(issues.map((i) => i.level)).toEqual(["warning", "warning"]);
  });

  it("does not warn about `home` while the flag is off", () => {
    expect(
      validateOwnPages(
        config({ experimental: { pages: false }, home: { hero: { headline: "Hi" } } })
      )
    ).toEqual([]);
    expect(validateOwnPages(config({ home: { hero: { headline: "Hi" } } }))).toEqual([]);
  });
});

describe("experimental.pages — output layout", () => {
  it("keeps bundles at the dist-root /assets while the flag is off", () => {
    expect(resolveBundlePath(false, "/docs")).toBe("/assets");
    expect(resolveBundlePath(false, "")).toBe("/assets");
    // This repository: flag off, so the bundle directory is unchanged.
    expect(bundlePath()).toBe("/assets");
    expect(ASSETS_DIR).toBe(`${DIST_DIR}/assets`);
  });

  it("moves bundles under the docs prefix under the flag", () => {
    expect(resolveBundlePath(true, "/docs")).toBe("/docs/_flame");
    expect(resolveBundlePath(true, "/handbook/v2")).toBe("/handbook/v2/_flame");
    // At a root deployment the bundle tree no longer shares /assets/ with the
    // content assets copied from docs/assets.
    expect(resolveBundlePath(true, "")).toBe("/_flame");
  });

  it("keeps the 404 at the root by default and inside the prefix under the flag", () => {
    expect(resolveNotFoundPath(false, "/docs")).toBe("/404.html");
    expect(resolveNotFoundPath(true, "/docs")).toBe("/docs/404.html");
    expect(resolveNotFoundPath(true, "")).toBe("/404.html");
    expect(notFoundPath()).toBe("/404.html");
  });

  it("links bundles relative to the dist root at any page depth", () => {
    const base = {
      title: "t",
      description: "",
      body: "",
      favicon: "",
      css: "docs.css",
      js: "client.js",
    };
    // Flag off: byte-identical to the historical `../assets/` climb.
    expect(htmlShell({ ...base, depth: 2 })).toContain('href="../../assets/docs.css"');
    // Under the flag the page climbs to the root and descends into the prefix.
    const flagged = htmlShell({ ...base, depth: 2, bundlePath: "/docs/_flame" });
    expect(flagged).toContain('href="../../docs/_flame/docs.css"');
    expect(flagged).toContain('src="../../docs/_flame/client.js"');
    // The 404 fallback stays root-absolute and carries the deployment path.
    const notFound = htmlShell({
      ...base,
      absoluteAssets: true,
      deployPath: "/repo",
      bundlePath: "/docs/_flame",
    });
    expect(notFound).toContain('href="/repo/docs/_flame/docs.css"');
  });
});

describe("experimental.pages — cleaning bundles a default build left at the root", () => {
  let dist = "";
  const touch = (rel: string) => {
    mkdirSync(join(dist, rel, ".."), { recursive: true });
    writeFileSync(join(dist, rel), "x");
  };
  const exists = (rel: string) => existsSync(join(dist, rel));
  const oldBundles = [
    "assets/client-ckvc56yt.js",
    "assets/home-client-CZFB9uYH.js",
    "assets/home-client-CZFB9uYH.js.map",
    "assets/docs-5d18b8c427d55bdd.css",
    "assets/site-bfb4e328460ae849.css",
    "assets/manifest.json",
    "assets/search-index.json",
    "assets/chunks/mermaid-abc.js",
  ];

  afterEach(() => {
    if (dist) rmSync(dist, { recursive: true, force: true });
  });

  function setup(): string {
    dist = mkdtempSync(join(tmpdir(), "flame-clean-"));
    for (const file of oldBundles) touch(file);
    return dist;
  }

  it("removes the whole root assets tree when the docs live elsewhere", async () => {
    setup();
    touch("docs/getting-started.html");
    await cleanRootBundlesIn(dist, join(dist, "docs/_flame"), join(dist, "docs"));
    expect(exists("assets")).toBe(false);
    expect(exists("docs/getting-started.html")).toBe(true);
  });

  it("keeps content assets at a root deployment and removes only Flame's bundles", async () => {
    setup();
    touch("assets/images/logo.svg");
    touch("assets/site-photo.png");
    await cleanRootBundlesIn(dist, join(dist, "_flame"), dist);
    for (const file of oldBundles) expect(exists(file), file).toBe(false);
    expect(exists("assets/images/logo.svg")).toBe(true);
    expect(exists("assets/site-photo.png")).toBe(true);
  });

  it("never deletes the docs output when basePath is /assets or under it", async () => {
    for (const prefix of ["assets", "assets/v2"]) {
      setup();
      touch(`${prefix}/index.html`);
      touch(`${prefix}/getting-started/overview.html`);
      await cleanRootBundlesIn(dist, join(dist, `${prefix}/_flame`), join(dist, prefix));
      expect(exists(`${prefix}/index.html`), prefix).toBe(true);
      expect(exists(`${prefix}/getting-started/overview.html`), prefix).toBe(true);
      expect(exists("assets/client-ckvc56yt.js"), prefix).toBe(false);
      expect(exists("assets/manifest.json"), prefix).toBe(false);
      rmSync(dist, { recursive: true, force: true });
      dist = "";
    }
  });

  it("does nothing while the bundle tree is still the root assets directory", async () => {
    setup();
    await cleanRootBundlesIn(dist, join(dist, "assets"), join(dist, "docs"));
    for (const file of oldBundles) expect(exists(file), file).toBe(true);
  });

  it("tolerates a dist without a root assets directory", async () => {
    dist = mkdtempSync(join(tmpdir(), "flame-clean-"));
    await expect(cleanRootBundlesIn(dist, join(dist, "_flame"), dist)).resolves.toBeUndefined();
    await expect(
      cleanRootBundlesIn(dist, join(dist, "docs/_flame"), join(dist, "docs"))
    ).resolves.toBeUndefined();
  });
});

describe("experimental.pages — what answers `/`", () => {
  it("keeps the landing page while the flag is off, at every prefix", () => {
    expect(resolveRootRoute(false, "/docs")).toBe("landing");
    expect(resolveRootRoute(false, "")).toBe("landing");
  });

  it("hands `/` to the docs index at a root deployment", () => {
    expect(resolveRootRoute(true, "")).toBe("docs-index");
  });

  it("redirects to the docs prefix otherwise", () => {
    expect(resolveRootRoute(true, "/docs")).toEqual({ redirect: "/docs" });
    expect(resolveRootRoute(true, "/handbook/v2")).toEqual({ redirect: "/handbook/v2" });
  });

  it("redirectResponse is a same-origin 302", () => {
    const res = redirectResponse("/docs");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/docs");
  });
});

describe("experimental.pages — standalone deploys", () => {
  const before = process.env[STANDALONE_ENV];
  afterEach(() => {
    if (before === undefined) delete process.env[STANDALONE_ENV];
    else process.env[STANDALONE_ENV] = before;
  });

  it("only applies under the flag with a docs prefix", () => {
    expect(needsStandaloneRoot(true, "/docs")).toBe(true);
    expect(needsStandaloneRoot(true, "")).toBe(false);
    expect(needsStandaloneRoot(false, "/docs")).toBe(false);
  });

  it("is a no-op for a project without the flag even when requested", () => {
    process.env[STANDALONE_ENV] = "1";
    expect(standaloneRoot()).toBe(false);
  });

  it("writes a script-free redirect that resolves under any deployment path", () => {
    const html = redirectHtml("/docs");
    expect(html).toContain('<meta http-equiv="refresh" content="0; url=./docs/">');
    expect(html).toContain('<a href="./docs/">');
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).not.toContain("<script");
    expect(redirectHtml("/handbook/v2")).toContain("url=./handbook/v2/");
  });
});

describe("experimental.pages — Docker and static-host config", () => {
  it("leaves the default nginx config and _headers untouched", () => {
    expect(buildNginxConf("/docs", {})).toBe(buildNginxConf("/docs"));
    expect(buildNginxConf("/docs")).toContain("error_page 404 /404.html;");
    expect(buildNginxConf("/docs")).not.toContain("location = / {");
    expect(buildHeadersFile()).toBe(HEADERS_FILE);
  });

  it("redirects `/` to the docs and serves the prefixed 404 under the flag", () => {
    const conf = buildNginxConf("/docs", { bundlePath: "/docs/_flame", ownPages: true });
    expect(conf).toContain("error_page 404 /docs/404.html;");
    expect(conf).toContain("location = /docs/404.html { }");
    expect(conf).toMatch(/location = \/ \{\s*absolute_redirect off;\s*return 302 \/docs\/;\s*\}/);
    expect(conf).toContain("location /docs/_flame/ {");
    expect(conf).toContain("location = /docs/_flame/search-index.json {");
    expect(conf).toContain("location /docs/assets/ {");
    expect(conf).not.toContain("location /assets/ {");
  });

  it("gives a flagged root deployment both cache blocks, which no longer collide", () => {
    const conf = buildNginxConf("", { bundlePath: "/_flame", ownPages: true });
    expect(conf).toContain("location /_flame/ {");
    expect(conf).toContain("location /assets/ {");
    expect(conf).toContain("error_page 404 /404.html;");
    expect(conf).not.toContain("location = / {");
  });

  it("points static-host cache rules at the moved bundle tree", () => {
    const headers = buildHeadersFile("/docs/_flame");
    expect(headers).toContain("/docs/_flame/client-*");
    expect(headers).toContain("/docs/_flame/search-index.json\n  Cache-Control: no-cache");
    expect(headers).not.toContain("/assets/client-*");
  });

  it("flags a kept nginx.conf only when it was generated for the other layout", () => {
    const plain = buildNginxConf("/docs");
    const flagged = buildNginxConf("/docs", { bundlePath: "/docs/_flame", ownPages: true });
    // Flag on: a default config predates it; a flagged config is current.
    expect(nginxConfIsStale(plain, true, "/docs/_flame")).toBe(true);
    expect(nginxConfIsStale(flagged, true, "/docs/_flame")).toBe(false);
    // Flag off: a config still serving the flagged tree is stale.
    expect(nginxConfIsStale(flagged, false, "/assets")).toBe(true);
    expect(nginxConfIsStale(plain, false, "/assets")).toBe(false);
    // A hand-edited default config never warns while the flag is off.
    const edited = plain.replace("location /assets/ {", "location ^~ /assets/ {");
    expect(nginxConfIsStale(edited, false, "/assets")).toBe(false);
    expect(nginxConfIsStale("server { listen 80; }", false, "/assets")).toBe(false);
  });

  it("recognizes a workflow that builds in standalone mode", () => {
    expect(workflowIsStandalone(`        env:\n          ${STANDALONE_ENV}: "1"\n`)).toBe(true);
    expect(workflowIsStandalone("      - run: bun run build\n")).toBe(false);
  });
});

describe("experimental.pages — cache invalidation", () => {
  it("folds the flag into the base-path stamp without changing the off form", () => {
    expect(ownPagesStamp(false)).toBe("");
    expect(ownPagesStamp(true)).toBe("+pages");
    // Flag off in this repository: byte-identical to the pre-flag stamp, so
    // existing caches stay valid.
    expect(basePathStamp()).toBe(prefixStamp(basePath(), ""));
    expect(prefixStamp("/docs", "") + ownPagesStamp(true)).toBe("/docs+pages");
  });

  it("keeps the stamp in the bundle key material and the resolver in the render stamp", () => {
    const src = read("cache-key.ts");
    expect(src).toMatch(/basePathStamp\(\)[\s\S]*ownPagesStamp\(ownPages\(\)\)/);
    expect(RENDER_SOURCE_FILES).toContain(".docu/node/experimental.ts");
  });
});

describe("experimental.pages — runtime parity", () => {
  // Bun and Node/Deno keep separate build, dev-server, preview and deploy
  // entries. Each pair must gate the same things on the flag, or one runtime
  // ships output the other does not.
  it("both build entries gate the landing page, place the 404, and clean stale output", () => {
    for (const file of ["build.ts", "build.impl.ts"]) {
      const src = read(file);
      expect(src, file).toContain("const bringOwnPages = resolveOwnPages(docuConfig)");
      expect(src, file).toContain("assertValidExperimental()");
      expect(src, file).toContain(
        "const docsIndexWritable = DOCS_OUT_DIR !== DIST_DIR || bringOwnPages"
      );
      expect(src, file).toMatch(
        /if \(bringOwnPages\) \{[\s\S]*redirectHtml\(servedBasePath\(\)\)[\s\S]*cleanRootBundles\(\)[\s\S]*\} else \{[\s\S]*OWN_PAGES_BUNDLE_DIR[\s\S]*React\.createElement\(IndexPage\)/
      );
      expect(src, file).toContain("const notFoundOut = join(DIST_DIR, notFoundPath().slice(1))");
      // Plugins find the moved bundle tree through the onEnd context.
      expect(src, file).toContain(
        "runOnEnd(pages, { assetManifest, outDir: DIST_DIR, assetsDir: ASSETS_DIR })"
      );
      expect(src, file).toMatch(/standaloneRoot\(\) && notFoundHtml/);
      // An authored docs/404 is served at arbitrary paths under the flag, so it
      // loads its assets root-absolutely, and a standalone build copies it to
      // the root instead of dropping the root 404.
      expect(src, file).toContain(
        '...(slug === "404" && ownPages() ? { absoluteAssets: true, deployPath: deployPath() } : {})'
      );
      expect(src, file).toMatch(
        /standaloneRoot\(\) && existsSync\(prefixedNotFound\)\) \{\s*await copyFile\(prefixedNotFound, rootNotFound\)/
      );
      // Every page shell receives the bundle location.
      expect(src.match(/bundlePath: bundlePath\(\),/g), file).toHaveLength(3);
      // The manifest check must tolerate a missing `home` only under the flag.
      expect(src, file).toMatch(/bringOwnPages\s*\?\s*manifest\.home === undefined/);
    }
  });

  it("both client bundlers drop the landing entry and expose the bundle path", () => {
    for (const file of ["hydrate.ts", "hydrate.node.ts"]) {
      const src = read(file);
      expect(src, file).toContain("const includeHome = !ownPages()");
      expect(src, file).toContain("includeHome && homeJs ? { home:");
      expect(src, file).toContain("`export const bundlePath = ${JSON.stringify(bundlePath())};`");
    }
  });

  it("both dev servers route `/` through resolveRootRoute", () => {
    for (const file of ["server.ts", "server.impl.ts"]) {
      const src = read(file);
      expect(src, file).toContain(
        "const rootRoute = resolveRootRoute(resolveOwnPages(docuConfig), resolvedBasePath)"
      );
      expect(src, file).toContain("assertValidExperimental()");
      expect(src, file).toMatch(
        /if \(rootRoute === "landing"\) response = await handleIndex\(state\);\s*else if \(rootRoute === "docs-index"\) response = await handleDocsIndex\(state\);\s*else response = redirectResponse\(rootRoute\.redirect\);/
      );
    }
  });

  it("both preview servers redirect `/` and find the 404 where the build put it", () => {
    for (const file of ["preview.ts", "preview.impl.ts"]) {
      const src = read(file);
      expect(src, file).toContain("const rootRoute = resolveRootRoute(ownPages(), basePath())");
      expect(src, file).toContain("resolve(DIST_DIR, notFoundPath().slice(1))");
      expect(src, file).toMatch(
        /const filePath = resolveFile\(pathname\);[\s\S]*if \(pathname === "\/" && typeof rootRoute === "object"\)[\s\S]*notFoundFiles\.find/
      );
    }
  });

  it("both deploy entries build standalone for Pages only and follow the bundle path", () => {
    const shared = read("deploy.shared.ts");
    expect(shared).toContain('if (!isDocker) process.env[STANDALONE_ENV] = "1"');
    const bun = read("deploy.ts");
    expect(bun).toContain(
      'env: isDocker ? process.env : { ...process.env, [STANDALONE_ENV]: "1" }'
    );
    for (const [file, src] of [
      ["deploy.shared.ts", shared],
      ["deploy.ts", bun],
    ] as const) {
      expect(src, file).toContain("buildNginxConf(servedBasePath(), nginxOptions())");
      expect(src, file).toContain("buildHeadersFile(bundlePath())");
      expect(src, file).toContain("workflowIsStandalone(");
      // The workflow warning only fires where standalone mode changes output.
      expect(src, file).toMatch(
        /needsStandaloneRoot\(ownPages\(\), basePath\(\)\) &&\s*!workflowIsStandalone\(/
      );
      expect(src, file).toContain("nginxConfIsStale(readFileSync(nginxPath");
      expect(src, file).not.toContain("assertDeployModeSupported");
    }
    // Both generated GitHub Pages workflows build in standalone mode.
    expect(bun).toMatch(/- run: bun run build\n\s+env:\n\s+FLAME_STANDALONE: "1"/);
    expect(shared).toMatch(
      /run build`,\n\s+"\s+env:",[\s\S]{0,200}?`\s+\$\{STANDALONE_ENV\}: "1"`/
    );
    expect(STANDALONE_ENV).toBe("FLAME_STANDALONE");
  });

  it("the search modal fetches the index from the bundle tree", () => {
    const search = readFileSync(new URL("../components/Search.tsx", import.meta.url), "utf-8");
    expect(search).toContain("fetch(`${deployPath}${bundlePath}/search-index.json`)");
  });
});
