import { describe, it, expect, afterEach } from "vitest";
import { DEPLOY_TARGET_ENV, resolveDeployTarget, canonicalNeedsHtml } from "../node/deploy-target";
import { deployTarget, STANDALONE_ENV } from "../node/paths";
import { buildSeoMeta } from "../node/seo";
import type { DocuConfig } from "../node/types";

const config = {
  meta: { title: "T", description: "", baseURL: "https://acme.github.io/repo" },
  navbar: { logoText: "T", menu: [] },
  footer: { social: [] },
  repo: { url: "", path: "", edit: false },
  routes: [],
} as unknown as DocuConfig;

describe("deploy target", () => {
  const before = process.env[DEPLOY_TARGET_ENV];
  afterEach(() => {
    if (before === undefined) delete process.env[DEPLOY_TARGET_ENV];
    else process.env[DEPLOY_TARGET_ENV] = before;
  });

  it("knows GitHub Pages and ignores anything else", () => {
    expect(resolveDeployTarget("github-pages")).toBe("github-pages");
    for (const value of [undefined, "", "vercel", "GitHub-Pages", "1"]) {
      expect(resolveDeployTarget(value), String(value)).toBeUndefined();
    }
  });

  it("needs .html canonical URLs only on GitHub Pages", () => {
    expect(canonicalNeedsHtml("github-pages")).toBe(true);
    expect(canonicalNeedsHtml(undefined)).toBe(false);
  });

  it("is read from the environment at call time", () => {
    delete process.env[DEPLOY_TARGET_ENV];
    expect(deployTarget()).toBeUndefined();
    process.env[DEPLOY_TARGET_ENV] = "github-pages";
    expect(deployTarget()).toBe("github-pages");
  });

  it("is a separate signal from experimental.pages' standalone mode", () => {
    expect(DEPLOY_TARGET_ENV).toBe("FLAME_DEPLOY_TARGET");
    expect(DEPLOY_TARGET_ENV).not.toBe(STANDALONE_ENV);
  });
});

describe("canonical URLs with the GitHub Pages target", () => {
  const html = { htmlSuffix: true };

  it("names the .html file for docs pages", () => {
    const seo = buildSeoMeta(config, {}, "guide/routing", "docs", html);
    expect(seo.url).toBe("https://acme.github.io/repo/docs/guide/routing.html");
  });

  it("keeps directory indexes as they are", () => {
    expect(buildSeoMeta(config, {}, "", "docs", html).url).toBe(
      "https://acme.github.io/repo/docs/"
    );
    expect(buildSeoMeta(config, {}, "", "landing", html).url).toBe("https://acme.github.io/repo/");
  });

  it("stays extensionless without the target, for clean-URL hosts", () => {
    expect(buildSeoMeta(config, {}, "guide/routing").url).toBe(
      "https://acme.github.io/repo/docs/guide/routing"
    );
    expect(buildSeoMeta(config, {}, "guide/routing", "docs", {}).url).toBe(
      "https://acme.github.io/repo/docs/guide/routing"
    );
  });

  it("does not touch the og:image URL", () => {
    const withImage = { ...config, meta: { ...config.meta, ogImage: "/docs/assets/og.png" } };
    expect(buildSeoMeta(withImage, {}, "guide/routing", "docs", html).image).toBe(
      "https://acme.github.io/repo/docs/assets/og.png"
    );
  });
});
