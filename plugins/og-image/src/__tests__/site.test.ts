import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DocuConfig } from "@docubook/flame";
import * as flame from "@docubook/flame/.docu/node/base-path";
import { buildSeoMeta } from "@docubook/flame/.docu/node/seo";
import { resolveOptions } from "../options";
import {
  canonicalBasePath,
  cardUrl,
  docsOutputDir,
  findLogoFile,
  findProjectRoot,
  isInside,
  normalizeBasePath,
  resolveBasePath,
  resolveDeployPath,
  resolveSite,
  sectionFor,
} from "../site";
import { imageRef } from "../cards";

const config = (meta: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  ({
    meta: { title: "Acme Docs", description: "", ...meta },
    routes: [],
    ...extra,
  }) as unknown as DocuConfig;

describe("base path rules mirror flame", () => {
  const values = [
    undefined,
    "",
    "/",
    "///",
    "/docs",
    "docs/",
    "/Docs",
    "/docs me",
    "/a/./b/../c",
    "https://host.dev/guide/",
    "/ü",
    " /guide ",
  ];

  it.each(values)("normalizeBasePath(%j)", (value) => {
    expect(normalizeBasePath(value)).toBe(flame.normalizeBasePath(value));
  });

  it.each(values.filter((v): v is string => typeof v === "string"))(
    "canonicalBasePath(%j)",
    (value) => {
      expect(canonicalBasePath(value)).toBe(flame.canonicalBasePath(value));
    }
  );

  it.each(values)("resolveBasePath with meta.basePath %j", (basePath) => {
    const cfg = config(basePath === undefined ? {} : { basePath });
    expect(resolveBasePath(cfg)).toBe(flame.resolveBasePath(cfg));
  });

  it.each([
    undefined,
    "https://docubook.pro/",
    "https://user.github.io/repo",
    "/repo/",
    "docs.example.com",
  ])("resolveDeployPath with meta.baseURL %j", (baseURL) => {
    const cfg = config(baseURL === undefined ? {} : { baseURL });
    expect(resolveDeployPath(cfg)).toBe(flame.resolveDeployPath(cfg));
  });
});

describe("card URLs match flame's og:image", () => {
  it.each([
    ["default prefix", { baseURL: "https://docubook.pro/" }],
    ["root deployment", { baseURL: "https://docubook.pro", basePath: "" }],
    ["GitHub Pages project site", { baseURL: "https://user.github.io/repo", basePath: "/docs" }],
    ["custom prefix", { baseURL: "https://acme.dev", basePath: "/Guide" }],
  ])("%s", (_name, meta) => {
    const cfg = config(meta);
    const site = resolveSite(cfg, resolveOptions({}), "/project");
    const file = "getting-started/configuration.0123abcd.png";
    const seo = buildSeoMeta(cfg, { image: imageRef(file) }, "getting-started/configuration");
    expect(seo.image).toBe(cardUrl(site, file));
  });
});

describe("resolveSite", () => {
  it("takes the site name from navbar, then meta, then the option", () => {
    const opts = resolveOptions({});
    expect(resolveSite(config({}, { navbar: { logoText: "Acme" } }), opts, "/p").siteName).toBe(
      "Acme"
    );
    expect(resolveSite(config({}), opts, "/p").siteName).toBe("Acme Docs");
    expect(resolveSite(config({}), resolveOptions({ siteName: "Override" }), "/p").siteName).toBe(
      "Override"
    );
  });

  it("shows host and deployment path as the domain", () => {
    const opts = resolveOptions({});
    expect(resolveSite(config({ baseURL: "https://docubook.pro/" }), opts, "/p").domain).toBe(
      "docubook.pro"
    );
    expect(
      resolveSite(config({ baseURL: "https://user.github.io/repo/" }), opts, "/p").domain
    ).toBe("user.github.io/repo");
    expect(resolveSite(config({}), opts, "/p").domain).toBeUndefined();
  });

  it("knows which generated pages exist", () => {
    const opts = resolveOptions({});
    const docs = resolveSite(config({}), opts, "/p");
    expect([docs.hasLanding, docs.hasDocsIndex]).toEqual([true, true]);
    const root = resolveSite(config({ basePath: "" }), opts, "/p");
    expect([root.hasLanding, root.hasDocsIndex]).toEqual([true, false]);
    const own = resolveSite(
      config({ basePath: "" }, { experimental: { pages: true } }),
      opts,
      "/p"
    );
    expect([own.hasLanding, own.hasDocsIndex]).toEqual([false, true]);
  });
});

describe("sectionFor", () => {
  const routes = [
    { title: "Getting Started", href: "/getting-started", items: [] },
    { title: "Components", href: "components/" },
  ] as DocuConfig["routes"];

  it("names the top-level group of nested pages", () => {
    expect(sectionFor(routes, "getting-started/configuration")).toBe("Getting Started");
    expect(sectionFor(routes, "getting-started/search/algolia")).toBe("Getting Started");
    expect(sectionFor(routes, "components/card")).toBe("Components");
  });

  it("gives top-level and unknown pages no section", () => {
    expect(sectionFor(routes, "introduction")).toBeUndefined();
    expect(sectionFor(routes, "blog/hello")).toBeUndefined();
    expect(sectionFor([], "a/b")).toBeUndefined();
  });
});

describe("paths", () => {
  it("places docs output under the prefix", () => {
    expect(docsOutputDir("/p/.docu/dist", "/docs")).toBe("/p/.docu/dist/docs");
    expect(docsOutputDir("/p/.docu/dist", "")).toBe("/p/.docu/dist");
  });

  it("detects paths outside a root", () => {
    expect(isInside("/p", "/p/docs/a.svg")).toBe(true);
    expect(isInside("/p", "/p")).toBe(true);
    expect(isInside("/p", "/etc/passwd")).toBe(false);
    expect(isInside("/p", "/p/../x")).toBe(false);
  });
});

describe("findLogoFile and findProjectRoot", () => {
  let root: string;
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "og-site-"));
    await mkdir(join(root, "docs/assets/images"), { recursive: true });
    await mkdir(join(root, "brand"), { recursive: true });
    await mkdir(join(root, "nested/deeper"), { recursive: true });
    await writeFile(join(root, "docu.json"), "{}");
    await writeFile(join(root, "docs/assets/images/logo.svg"), "<svg/>");
    await writeFile(join(root, "brand/mark.png"), "png");
    await writeFile(join(root, "brand/mark.gif"), "gif");
  });
  afterAll(() => rm(root, { recursive: true, force: true }));

  const site = (meta: Record<string, unknown> = {}) =>
    resolveSite(config(meta), resolveOptions({}), root);
  const expectFile = (lookup: ReturnType<typeof findLogoFile>, file: string) =>
    expect(lookup).toEqual({ file: join(root, file) });

  it("maps site paths under the docs prefix to docs/", () => {
    expectFile(
      findLogoFile("/docs/assets/images/logo.svg", site(), ""),
      "docs/assets/images/logo.svg"
    );
    expectFile(
      findLogoFile("/guide/assets/images/logo.svg", site({ basePath: "/guide" }), ""),
      "docs/assets/images/logo.svg"
    );
    // flame re-bases the default `/docs` spelling onto a custom prefix
    expectFile(
      findLogoFile("/docs/assets/images/logo.svg", site({ basePath: "/guide" }), ""),
      "docs/assets/images/logo.svg"
    );
    expectFile(
      findLogoFile("/assets/images/logo.svg", site({ basePath: "" }), ""),
      "docs/assets/images/logo.svg"
    );
    expectFile(
      findLogoFile("/repo/docs/assets/images/logo.svg?v=2", site(), "/repo"),
      "docs/assets/images/logo.svg"
    );
  });

  it("resolves project paths", () => {
    expectFile(findLogoFile("brand/mark.png", site(), ""), "brand/mark.png");
    expectFile(findLogoFile("./assets/images/logo.svg", site(), ""), "docs/assets/images/logo.svg");
  });

  it("reports why a logo cannot be used", () => {
    expect(findLogoFile("https://cdn.dev/logo.svg", site(), "")).toMatchObject({
      reason: "remote",
    });
    expect(findLogoFile("../outside.svg", site(), "")).toMatchObject({ reason: "outside" });
    expect(findLogoFile("brand/none.svg", site(), "")).toMatchObject({ reason: "missing" });
    expect(findLogoFile("brand/mark.gif", site(), "")).toMatchObject({ reason: "type" });
  });

  it("finds docu.json above the working directory", () => {
    expect(findProjectRoot(join(root, "nested/deeper"))).toBe(root);
  });
});
