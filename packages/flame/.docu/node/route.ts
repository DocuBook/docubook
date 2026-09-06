import { loadDocuConfig } from "./paths";
import type { DocuRoute } from "./types";
import { resolveRoutes } from "./fs-scanner";
import { DOCS_DIR } from "./paths";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractFrontmatter } from "@docubook/core";
import { getPageFrontmatter, registerPageFrontmatter } from "./mdx";
import type { Frontmatter } from "./mdx";

const docuConfig = loadDocuConfig();
export const routes: DocuRoute[] = resolveRoutes(docuConfig.routes);

export function flattenRoutes(): string[] {
  const paths: string[] = [];

  function traverse(route: DocuRoute, section = "") {
    const fullPath = route.href.startsWith(section)
      ? route.href
      : `${section}${route.href}`.replace(/\/+/g, "/");
    if (route.href && !route.noLink) {
      paths.push(fullPath);
    }
    if (route.items) {
      route.items.forEach((item) => traverse(item, fullPath));
    }
  }

  routes.forEach((route) => traverse(route));
  return paths;
}

export function getRouteMap(): Map<string, string> {
  const map = new Map<string, string>();

  function traverse(route: DocuRoute, section = "") {
    const fullPath = route.href.startsWith(section)
      ? route.href
      : `${section}${route.href}`.replace(/\/+/g, "/");
    map.set(fullPath, route.title);
    if (route.items) {
      route.items.forEach((item) => traverse(item, fullPath));
    }
  }

  routes.forEach((route) => traverse(route));
  return map;
}

/**
 * Single pagination entry builder (DRY) — one `readPageFrontmatter` call
 * serves both prev + next from the parse-once registry, so no file is
 * re-read or re-parsed. `description` rides along on prev too; the UI
 * keeps the paired prev minimal by design and only renders the rich
 * title + description when prev stands alone (last page, no next).
 */
function toPaginationEntry(href: string, routeMap: Map<string, string>) {
  const fm = readPageFrontmatter(href);
  return {
    href,
    title: fm.title || routeMap.get(href) || "",
    description: fm.description || "",
  };
}

/**
 * Frontmatter for a page — read from the parse-once registry (populated
 * during compilation) instead of re-reading + re-parsing the file. Falls
 * back to a direct read only for pages the dev server has not compiled yet,
 * and caches the result back into the registry.
 */
function readPageFrontmatter(href: string): Frontmatter {
  const registered = getPageFrontmatter(href);
  if (registered) return registered;

  let fm: Frontmatter = {};
  const rel = href.replace(/^\/|$/g, "");
  for (const ext of [".mdx", ".md"]) {
    for (const file of [join(DOCS_DIR, `${rel}${ext}`), join(DOCS_DIR, `${rel}/index${ext}`)]) {
      try {
        fm = extractFrontmatter<Frontmatter>(readFileSync(file, "utf-8"));
        break;
      } catch {
        // not this file — try the next candidate
      }
    }
    if (Object.keys(fm).length) break;
  }
  registerPageFrontmatter(href, fm);
  return fm;
}

export function getPreviousNext(pathname: string) {
  const normalizedPath = pathname.replace(/^\/|$/g, "");

  // Docs index (/docs — DocsPage renders with pathname "" from slug []):
  // next-only navigation into the first docs page — never read the route
  // backward from the index, so prev stays null even if a page sits before
  // it in the route list.
  if (normalizedPath === "docs" || normalizedPath === "") {
    const paths = flattenRoutes();
    const routeMap = getRouteMap();
    const first = paths[0];
    if (!first) return { prev: null, next: null };
    return { prev: null, next: toPaginationEntry(first, routeMap) };
  }

  const paths = flattenRoutes();

  const index = paths.findIndex((href) => href === `/${normalizedPath}` || href === normalizedPath);

  if (index === -1) {
    return { prev: null, next: null };
  }

  const routeMap = getRouteMap();
  const prevHref = index > 0 ? paths[index - 1] : null;
  const nextHref = index < paths.length - 1 ? paths[index + 1] : null;

  return {
    prev: prevHref ? toPaginationEntry(prevHref, routeMap) : null,
    next: nextHref ? toPaginationEntry(nextHref, routeMap) : null,
  };
}

export function getPagination(currentPath: string) {
  return getPreviousNext(currentPath);
}

export function getSection(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] || "home";
}
