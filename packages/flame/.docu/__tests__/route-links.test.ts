import { describe, it, expect, vi } from "vitest";
import { hasUrlScheme, sidebarLinkHref, splitPathSuffix } from "../node/utils";
import { flattenRoutes, getRouteMap } from "../node/route";
import type { DocuRoute } from "../node/types";

vi.mock("../node/client-routes", () => ({
  routes: [],
  config: { meta: { title: "T" }, navbar: { logoText: "T", menu: [] }, sidebar: {} },
  basePath: "/docs",
  deployPath: "",
  bundlePath: "/assets",
}));
const { getFirstItemHref } = await import("../components/Context");

describe("sidebar URL helpers", () => {
  it("recognizes URLs with a scheme or protocol-relative ones", () => {
    for (const url of ["https://a.dev", "http://a.dev", "mailto:x@y.z", "//cdn.dev/x", "tel:123"]) {
      expect(hasUrlScheme(url), url).toBe(true);
    }
    for (const path of ["/guide", "guide", "/guide#a", "#a", ""]) {
      expect(hasUrlScheme(path), path).toBe(false);
    }
  });

  it("splits a docs path from its query or fragment", () => {
    expect(splitPathSuffix("/docs/intro#setup")).toEqual({
      pathname: "/docs/intro",
      suffix: "#setup",
    });
    expect(splitPathSuffix("/docs/intro?tab=2#a")).toEqual({
      pathname: "/docs/intro",
      suffix: "?tab=2#a",
    });
    expect(splitPathSuffix("/docs/intro")).toEqual({ pathname: "/docs/intro", suffix: "" });
  });

  it("puts .html before the suffix and leaves external URLs alone", () => {
    expect(sidebarLinkHref("/docs/intro")).toBe("/docs/intro.html");
    expect(sidebarLinkHref("/docs/intro#setup")).toBe("/docs/intro.html#setup");
    expect(sidebarLinkHref("/docs/intro?tab=2")).toBe("/docs/intro.html?tab=2");
    expect(sidebarLinkHref("https://github.com/acme/docs")).toBe("https://github.com/acme/docs");
  });
});

describe("pagination sequence with external and fragment routes", () => {
  const tree: DocuRoute[] = [
    {
      title: "Getting Started",
      href: "/getting-started",
      noLink: true,
      items: [
        { title: "Overview", href: "/overview" },
        { title: "GitHub", href: "https://github.com/acme/docs" },
        { title: "Configuration", href: "/configuration" },
        { title: "Config: meta", href: "/configuration#meta" },
      ],
    },
  ];

  it("lists docs pages only, once each, without fragments", () => {
    expect(flattenRoutes(tree)).toEqual([
      "/getting-started/overview",
      "/getting-started/configuration",
    ]);
  });

  it("keeps the page title from its first entry", () => {
    const map = getRouteMap(tree);
    expect(map.get("/getting-started/configuration")).toBe("Configuration");
    expect([...map.keys()].some((key) => key.includes("http") || key.includes("#"))).toBe(false);
  });

  it("is unchanged for plain trees", () => {
    const plain: DocuRoute[] = [
      { title: "G", href: "/g", noLink: true, items: [{ title: "A", href: "/a" }] },
    ];
    expect(flattenRoutes(plain)).toEqual(["/g/a"]);
  });
});

describe("context switcher target", () => {
  it("skips an external first item and drops fragments", () => {
    expect(
      getFirstItemHref({
        href: "/getting-started",
        items: [{ href: "https://github.com/acme/docs" }, { href: "/overview#intro" }],
      })
    ).toBe("/getting-started/overview");
  });

  it("falls back to the section itself when it has no docs item", () => {
    expect(getFirstItemHref({ href: "/links", items: [{ href: "https://a.dev" }] })).toBe("/links");
    expect(getFirstItemHref({ href: "/solo" })).toBe("/solo");
  });
});
