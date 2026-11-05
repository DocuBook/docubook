import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

// The page reads the logo from docu.json and builds root-absolute links from
// the served base and deployment paths; each case below sets them.
const state = vi.hoisted(() => ({
  config: { navbar: { logo: { src: "/docs/assets/images/logo.svg", alt: "Acme" } } } as Record<
    string,
    unknown
  >,
  basePath: "/docs",
  deployPath: "",
}));
vi.mock("../node/paths", () => ({
  loadDocuConfig: () => state.config,
  servedBasePath: () => state.basePath,
  servedDeployPath: () => state.deployPath,
}));

const { default: NotFoundPage } = await import("../pages/404");
const render = () => renderToStaticMarkup(createElement(NotFoundPage));

describe("generated 404 page", () => {
  beforeEach(() => {
    state.config = { navbar: { logo: { src: "/docs/assets/images/logo.svg", alt: "Acme" } } };
    state.basePath = "/docs";
    state.deployPath = "";
  });

  it("shows the 404 headline, the subheadline and a short explanation", () => {
    const html = render();
    expect(html).toMatch(/<h1[^>]*>404<\/h1>/);
    expect(html).toMatch(/<p[^>]*>Page not found<\/p>/);
    expect(html).toContain("does not exist or has been moved");
  });

  it("uses the project's logo as the mascot, decorative and root-absolute", () => {
    const html = render();
    expect(html).toContain('<img src="/docs/assets/images/logo.svg" alt=""');
    expect(html).toMatch(/<div class="relative flex[^"]*" aria-hidden="true">/);
  });

  it("animates the mascot only for visitors who allow motion", () => {
    const html = render();
    for (const name of ["float", "shadow", "halo", "drift"]) {
      expect(html, name).toContain(`motion-safe:animate-mascot-${name}`);
      expect(html, name).not.toMatch(new RegExp(`(?<!motion-safe:)animate-mascot-${name}`));
    }
  });

  it("falls back to an inline illustration without a configured logo", () => {
    state.config = { navbar: {} };
    const html = render();
    expect(html).not.toContain("<img");
    expect(html).toContain('viewBox="0 0 120 140"');
  });

  it("offers docs and home as labelled buttons with icons", () => {
    const html = render();
    const links = [...html.matchAll(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/g)].map((m) => ({
      href: m[1],
      label: m[2]!.replace(/<[^>]+>/g, ""),
      icon: /<svg[^>]*aria-hidden="true"/.test(m[2]!),
    }));
    expect(links).toEqual([
      { href: "/docs/", label: "Go to docs", icon: true },
      { href: "/", label: "Back to home", icon: true },
    ]);
  });

  it("shows a single button at a root deployment, where docs and home share /", () => {
    state.basePath = "";
    const html = render();
    const hrefs = [...html.matchAll(/<a href="([^"]*)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(["/"]);
    expect(html).toContain("Back to home");
    expect(html).not.toContain("Go to docs");
  });

  it("keeps every URL under the deployment path", () => {
    state.deployPath = "/repo";
    const html = render();
    expect(html).toContain('<img src="/repo/docs/assets/images/logo.svg"');
    const hrefs = [...html.matchAll(/<a href="([^"]*)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(["/repo/docs/", "/repo/"]);
  });

  it("passes an external logo URL through", () => {
    state.config = { navbar: { logo: { src: "https://cdn.acme.dev/logo.svg" } } };
    expect(render()).toContain('<img src="https://cdn.acme.dev/logo.svg"');
  });
});
