import docuConfig from "../../docu.json" with { type: "json" };
import type { DocuRoute } from "./types";
import { resolveRoutes } from "./fs-scanner";

// Get routes: manual from docu.json, or auto-scan docs folder
export const routes: DocuRoute[] = resolveRoutes(docuConfig.routes);

/** Get all route paths (flattened) */
export function flattenRoutes(basePath = ""): string[] {
  const paths: string[] = [];

  function traverse(route: DocuRoute, section = "") {
    if (route.href && !route.noLink) {
      paths.push(`${section}${route.href}`);
    }
    if (route.items) {
      route.items.forEach(item => traverse(item, `${section}${route.href}/`));
    }
  }

  routes.forEach(route => traverse(route));
  return paths;
}

/** Get all routes as path -> title mapping */
export function getRouteMap(): Map<string, string> {
  const map = new Map<string, string>();

  function traverse(route: DocuRoute, section = "") {
    const fullPath = `${section}${route.href}`;
    map.set(fullPath, route.title);
    if (route.items) {
      route.items.forEach(item => traverse(item, `${fullPath}/`));
    }
  }

  routes.forEach(route => traverse(route));
  return map;
}


export function getPreviousNext(pathname: string) {

  const normalizedPath = pathname.replace(/^\/|$/g, "");
  const paths = flattenRoutes("/docs");
  
  const index = paths.findIndex(
    (href) => href === `/${normalizedPath}` || href === normalizedPath
  );
  
  if (index === -1) {
    return { prev: null, next: null };
  }
  
  const routeMap = getRouteMap();
  const prevHref = index > 0 ? paths[index - 1] : null;
  const nextHref = index < paths.length - 1 ? paths[index + 1] : null;
  
  return {
    prev: prevHref ? { href: prevHref, title: routeMap.get(prevHref) || "" } : null,
    next: nextHref ? { href: nextHref, title: routeMap.get(nextHref) || "" } : null,
  };
}

export function getPagination(currentPath: string) {
  return getPreviousNext(currentPath);
}

export function getSection(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] || "home";
}