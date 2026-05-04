import docuConfig from "../docu.json" with { type: "json" };
import type { DocuRoute } from "./types";

/** Flatten routes from docu.json */
export function flattenRoutes(routes: DocuRoute[], basePath = ""): string[] {
  const paths: string[] = [];

  for (const route of routes) {
    if (route.href && !route.noLink) {
      paths.push(`${basePath}${route.href}`);
    }
    if (route.items) {
      paths.push(...flattenRoutes(route.items, basePath));
    }
  }

  return paths;
}

/** Get all routes as path -> title mapping */
export function getRouteMap(): Map<string, string> {
  const map = new Map<string, string>();

  function traverse(routes: DocuRoute[], section = "") {
    for (const route of routes) {
      const fullPath = section + route.href;
      map.set(fullPath, route.title);

      if (route.items) {
        traverse(route.items, fullPath + "/");
      }
    }
  }

  traverse(docuConfig.routes || []);
  return map;
}

/** Get prev/next for pagination */
export function getPagination(currentPath: string) {
  const paths = flattenRoutes(docuConfig.routes || [], "/docs");
  const index = paths.indexOf(currentPath);

  return {
    prev: index > 0 ? paths[index - 1] : null,
    next: index < paths.length - 1 ? paths[index + 1] : null,
  };
}

/** Get section for active route */
export function getSection(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] || "home";
}