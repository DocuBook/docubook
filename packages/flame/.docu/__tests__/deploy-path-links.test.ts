import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// A GitHub Pages project site: the host serves the dist under /handbook and the
// docs keep the default /docs prefix inside it.
vi.mock("../node/client-routes", () => ({
  routes: [],
  config: {
    meta: { title: "T", baseURL: "https://acme.github.io/handbook" },
    navbar: { logo: { src: "/docs/assets/images/logo.svg", alt: "Logo" }, logoText: "Docs" },
  },
  basePath: "/docs",
  deployPath: "/handbook",
  bundlePath: "/assets",
}));

const { default: Sublink } = await import("../components/Sublink");
const { Navbar } = await import("../components/Navbar");

describe("chrome links under a host deployment path", () => {
  it("sidebar links point inside the deployment path", () => {
    const html = renderToStaticMarkup(
      createElement(Sublink, { title: "Routing", href: "/guide/routing", level: 1 })
    );
    expect(html).toContain('href="/handbook/docs/guide/routing.html"');
  });

  it("sidebar keeps a #fragment after .html and links external routes as written", () => {
    const anchor = renderToStaticMarkup(
      createElement(Sublink, { title: "Setup", href: "/guide/routing#setup", level: 1 })
    );
    expect(anchor).toContain('href="/handbook/docs/guide/routing.html#setup"');
    const query = renderToStaticMarkup(
      createElement(Sublink, { title: "Tab", href: "/guide/routing?tab=2", level: 1 })
    );
    expect(query).toContain('href="/handbook/docs/guide/routing.html?tab=2"');
    // A nested external entry keeps no parent path, prefix or .html.
    const external = renderToStaticMarkup(
      createElement(Sublink, {
        title: "GitHub",
        href: "https://github.com/acme/docs",
        level: 1,
        parentHref: "/docs/getting-started",
      })
    );
    expect(external).toContain('href="https://github.com/acme/docs"');
    expect(external).not.toContain("getting-startedhttps");
  });

  it("navbar logo, logo link and menu links point inside the deployment path", () => {
    const html = renderToStaticMarkup(
      createElement(Navbar, {
        logo: { src: "/docs/assets/images/logo.svg", alt: "Logo" },
        logoText: "Docs",
        menu: [
          { title: "Home", href: "/" },
          { title: "Guide", href: "/docs/guide/routing" },
          { title: "GitHub", href: "https://github.com/acme/handbook" },
        ],
      })
    );
    expect(html).toContain('src="/handbook/docs/assets/images/logo.svg"');
    expect(html).toContain('href="/handbook/docs"');
    expect(html).toContain('href="/handbook/"');
    expect(html).toContain('href="/handbook/docs/guide/routing.html"');
    expect(html).toContain('href="https://github.com/acme/handbook"');
    // Nothing internal may escape to the origin root.
    expect(html).not.toMatch(/(?:href|src)="\/docs/);
  });
});
