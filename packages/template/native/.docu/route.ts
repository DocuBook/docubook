import docuConfig from "../docu.json" with { type: "json" };
import type { DocuRoute } from "./types";
import { resolveRoutes } from "./fs-scanner";

// Get routes: manual from docu.json, or auto-scan docs folder
export const routes: DocuRoute[] = resolveRoutes(docuConfig.routes);

/** Get all route paths (flattened) */
export function flattenRoutes(basePath = ""): string[] {
  const paths: string[] = [];

  function traverse(r: DocuRoute[], section = "") {
    if (r.href && !r.noLink) {
      paths.push(`${section}${r.href}`);
    }
    if (r.items) {
      r.items.forEach(item => traverse(item, `${section}${r.href}/`));
    }
  }

  routes.forEach(route => traverse(route));
  return paths;
}

/** Get all routes as path -> title mapping */
export function getRouteMap(): Map<string, string> {
  const map = new Map<string, string>();

  function traverse(r: DocuRoute[], section = "") {
    const fullPath = `${section}${r.href}`;
    map.set(fullPath, r.title);
    if (r.items) {
      r.items.forEach(item => traverse(item, `${fullPath}/`));
    }
  }

  routes.forEach(route => traverse(route));
  return map;
}

/** Get prev/next for pagination */
export function getPagination(currentPath: string) {
  const paths = flattenRoutes("/docs");
  const index = paths.indexOf(currentPath);

  return {
    prev: index > 0 ? paths[index - 1] : null,
    next: index < paths.length - 1 ? paths[index + 1] : null,
  };
}

/** Get section from pathname */
export function getSection(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] || "home";
}