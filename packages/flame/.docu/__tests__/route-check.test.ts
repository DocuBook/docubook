import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findMissingRouteTargets, missingRoutesWarning } from "../node/route-check";
import { scanMdxFiles, resolveDocsIndexSource } from "../node/server-utils";
import type { DocuRoute } from "../node/types";

const routes: DocuRoute[] = [
  {
    title: "Getting Started",
    href: "/getting-started",
    noLink: true,
    items: [
      { title: "Overview", href: "/overview" },
      { title: "Configuration", href: "/configuration" },
    ],
  },
  {
    title: "Guide",
    href: "/guide",
    noLink: true,
    items: [
      { title: "Routing", href: "/routing" },
      {
        title: "Search",
        href: "/search",
        noLink: true,
        items: [{ title: "Algolia", href: "/algolia" }],
      },
    ],
  },
];
const pages = ["getting-started/overview", "getting-started/configuration", "guide/routing"];

describe("findMissingRouteTargets", () => {
  it("reports nothing when every link has a source", () => {
    expect(findMissingRouteTargets(routes, [...pages, "guide/search/algolia"], false)).toEqual([]);
  });

  it("builds nested paths the way the sidebar does and reports the trail", () => {
    const missing = findMissingRouteTargets(routes, pages.slice(0, 2), false);
    expect(missing).toEqual([
      { path: "/guide/routing", trail: ["Guide", "Routing"] },
      { path: "/guide/search/algolia", trail: ["Guide", "Search", "Algolia"] },
    ]);
  });

  it("skips noLink groups but still checks their children", () => {
    const missing = findMissingRouteTargets(routes, pages, false);
    expect(missing.map((m) => m.path)).toEqual(["/guide/search/algolia"]);
    // `/guide` and `/guide/search` are noLink groups, never reported themselves.
    expect(missing.some((m) => m.path === "/guide" || m.path === "/guide/search")).toBe(false);
  });

  it("checks a linked group as a page too", () => {
    const linked: DocuRoute[] = [
      { title: "Guide", href: "/guide", items: [{ title: "Routing", href: "/routing" }] },
    ];
    expect(findMissingRouteTargets(linked, ["guide/routing"], false).map((m) => m.path)).toEqual([
      "/guide",
    ]);
  });

  it("ignores external links and strips fragments and queries", () => {
    const mixed: DocuRoute[] = [
      { title: "GitHub", href: "https://github.com/acme/docs" },
      { title: "CDN", href: "//cdn.example.com/x" },
      { title: "Mail", href: "mailto:docs@example.com" },
      { title: "Intro anchor", href: "/intro#setup" },
      { title: "Intro query", href: "/intro?tab=2" },
    ];
    expect(findMissingRouteTargets(mixed, ["intro"], false)).toEqual([]);
  });

  it("maps the docs root to docs/index and collapses doubled slashes", () => {
    const root: DocuRoute[] = [{ title: "Home", href: "/" }];
    expect(findMissingRouteTargets(root, [], true)).toEqual([]);
    expect(findMissingRouteTargets(root, [], false)).toEqual([{ path: "/", trail: ["Home"] }]);
    const slashes: DocuRoute[] = [
      { title: "G", href: "/guide/", noLink: true, items: [{ title: "R", href: "/routing" }] },
    ];
    expect(findMissingRouteTargets(slashes, ["guide/routing"], false)).toEqual([]);
  });

  it("reports a broken path once even when several entries link to it", () => {
    const dup: DocuRoute[] = [
      { title: "A", href: "/gone" },
      { title: "B", href: "/gone" },
    ];
    expect(findMissingRouteTargets(dup, [], false)).toHaveLength(1);
  });

  it("checks nothing when docu.json has no routes table (the sidebar is scanned)", () => {
    expect(findMissingRouteTargets(undefined, [], false)).toEqual([]);
    expect(findMissingRouteTargets([], [], false)).toEqual([]);
  });

  it("tolerates malformed entries", () => {
    const bad = [
      { title: "No href" },
      null,
      { title: "Ok", href: "/intro" },
    ] as unknown as DocuRoute[];
    expect(findMissingRouteTargets(bad, ["intro"], false)).toEqual([]);
  });
});

describe("findMissingRouteTargets — separator sidebar mode", () => {
  const sections: DocuRoute[] = [
    {
      title: "Getting Started",
      href: "/getting-started",
      context: { title: "Guide" },
      items: [{ title: "Introduction", href: "/introduction" }],
    },
    // Hidden in separator mode once any route has a context.
    { title: "Hidden", href: "/hidden" },
  ];

  it("treats context sections as headers and hides routes without a context", () => {
    expect(
      findMissingRouteTargets(sections, ["getting-started/introduction"], false, {
        separator: true,
      })
    ).toEqual([]);
  });

  it("still checks the items of a context section", () => {
    expect(
      findMissingRouteTargets(sections, [], false, { separator: true }).map((m) => m.path)
    ).toEqual(["/getting-started/introduction"]);
  });

  it("checks the same section as a link in dropdown mode, where it is one", () => {
    expect(
      findMissingRouteTargets(sections, ["getting-started/introduction"], false).map((m) => m.path)
    ).toEqual(["/getting-started", "/hidden"]);
  });

  it("falls back to a flat list of links when no route has a context", () => {
    const flat: DocuRoute[] = [{ title: "Intro", href: "/intro" }];
    expect(
      findMissingRouteTargets(flat, [], false, { separator: true }).map((m) => m.path)
    ).toEqual(["/intro"]);
  });

  it("catches child hrefs that repeat the parent path, as the old docs example did", () => {
    const repeated: DocuRoute[] = [
      {
        title: "Getting Started",
        href: "/docs/getting-started",
        noLink: true,
        items: [{ title: "Introduction", href: "/docs/getting-started/introduction" }],
      },
    ];
    expect(
      findMissingRouteTargets(repeated, ["getting-started/introduction"], false).map((m) => m.path)
    ).toEqual(["/docs/getting-started/docs/getting-started/introduction"]);
  });
});

describe("missingRoutesWarning", () => {
  it("is undefined when nothing is missing", () => {
    expect(missingRoutesWarning([])).toBeUndefined();
  });

  it("lists every broken entry with its sidebar trail", () => {
    const text = missingRoutesWarning(findMissingRouteTargets(routes, pages.slice(0, 2), false))!;
    expect(text).toContain('docu.json "routes" links to 2 page(s) with no source in docs/');
    expect(text).toContain("/guide/routing  (Guide › Routing)");
    expect(text).toContain("/guide/search/algolia  (Guide › Search › Algolia)");
    expect(text).toContain("fix or remove the entry in docu.json");
  });
});

describe("route check on real projects — no false positives", () => {
  const root = join(import.meta.dirname, "..", "..");
  for (const [label, dir] of [
    ["flame's own docs", root],
    ["the starter template", join(root, "template")],
  ] as const) {
    it(`finds no broken routes in ${label}`, async () => {
      const config = JSON.parse(readFileSync(join(dir, "docu.json"), "utf-8"));
      const docs = join(dir, "docs");
      const files = await scanMdxFiles(docs);
      const missing = findMissingRouteTargets(
        config.routes,
        files.map((f) => f.path),
        Boolean(resolveDocsIndexSource(docs)),
        { separator: config.sidebar?.context === "separator" }
      );
      expect(missing).toEqual([]);
    });
  }
});

describe("route check — wired into every entry", () => {
  const read = (rel: string) => readFileSync(new URL(`../node/${rel}`, import.meta.url), "utf-8");
  it("runs in both builds right after the MDX scan, and in both dev servers", () => {
    for (const file of ["build.ts", "build.impl.ts"]) {
      expect(read(file), file).toMatch(
        /const mdxFiles = await scanMdxFiles\(DOCS_DIR\);\s*\/\/[^\n]*\n[^\n]*\n\s*const routesWarning = missingRoutesWarning\(/
      );
    }
    for (const file of ["server.ts", "server.impl.ts"]) {
      expect(read(file), file).toMatch(
        /findMissingRouteTargets\(\s*docuConfig\.routes,\s*\(await scanMdxFiles\(DOCS_DIR\)\)\.map/
      );
      expect(read(file), file).toContain("if (routesWarning) logger.warn(routesWarning);");
    }
  });
});
