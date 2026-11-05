import type { DocuRoute } from "./types";

/**
 * Check the `routes` table of `docu.json` against the docs that exist.
 *
 * Pure: takes the routes and the scanned page slugs, touches no filesystem, so
 * the build and both dev servers share it and tests can feed it anything.
 *
 * It mirrors how the sidebar builds a link (`Sublink`): every href along the
 * path from the top-level route is concatenated under the docs prefix, and the
 * link points at `<prefix><path>.html`. A route is a link unless it is
 * `noLink`; its children are checked either way. In `sidebar.context:
 * "separator"` mode with context sections, the menu shows only the routes that
 * have a `context`, as plain group headers, so their own href is not a link and
 * routes without a context are not shown at all. A link is broken when no MDX
 * source has that exact slug, so the page 404s — typically after a page was
 * renamed or deleted but the sidebar entry was kept.
 */

export interface MissingRouteTarget {
  /** Route path relative to the docs prefix, e.g. `/guide/routing`. */
  path: string;
  /** Titles from the top-level route down to this entry, for locating it. */
  trail: string[];
}

/** External links and fragments are not docs pages. */
function isCheckableHref(href: string): boolean {
  return !/^([a-z][a-z\d+.-]*:|\/\/)/i.test(href);
}

function joinRoutePath(parent: string, href: string): string {
  const withoutFragment = href.split("#")[0]!.split("?")[0]!;
  return `${parent}${withoutFragment}`.replace(/\/{2,}/g, "/");
}

function slugOf(path: string): string {
  return path.replace(/^\/+|\/+$/g, "");
}

/**
 * Find the `routes` entries that link to a docs page with no source.
 *
 * @param routes - `routes` from docu.json; an empty or missing table means the
 *   sidebar is scanned from the docs folder and always matches it, so nothing
 *   is reported.
 * @param pageSlugs - scanned MDX paths without extension (`guide/routing`).
 * @param hasDocsIndex - whether `docs/index.mdx` (or `.md`) exists; it serves
 *   the docs root, slug `""`.
 */
export function findMissingRouteTargets(
  routes: DocuRoute[] | undefined,
  pageSlugs: Iterable<string>,
  hasDocsIndex: boolean,
  options: { separator?: boolean } = {}
): MissingRouteTarget[] {
  if (!Array.isArray(routes) || routes.length === 0) return [];
  const pages = new Set(pageSlugs);
  const missing: MissingRouteTarget[] = [];
  const seen = new Set<string>();

  const visit = (route: DocuRoute, parent: string, trail: string[], header = false) => {
    if (!route || typeof route.href !== "string") return;
    const here = [...trail, route.title];
    if (!isCheckableHref(route.href)) return;
    const path = joinRoutePath(parent, route.href);
    if (!route.noLink && !header) {
      const slug = slugOf(path);
      const exists = slug === "" ? hasDocsIndex : pages.has(slug);
      if (!exists && !seen.has(slug)) {
        seen.add(slug);
        missing.push({ path: `/${slug}`, trail: here });
      }
    }
    for (const item of route.items ?? []) visit(item, path, here);
  };

  // Separator mode renders context routes as headers and hides the rest; with
  // no context route at all it falls back to a flat list of links.
  const sections = options.separator ? routes.filter((route) => route?.context) : [];
  if (sections.length > 0) {
    for (const route of sections) visit(route, "", [], true);
  } else {
    for (const route of routes) visit(route, "", []);
  }
  return missing;
}

/**
 * One warning for every broken `routes` entry, or `undefined` when all of
 * them resolve. Lists each entry with its sidebar trail so it can be found in
 * docu.json.
 */
export function missingRoutesWarning(missing: MissingRouteTarget[]): string | undefined {
  if (missing.length === 0) return undefined;
  const lines = missing.map((m) => `    ${m.path}  (${m.trail.join(" › ")})`);
  return [
    `docu.json "routes" links to ${missing.length} page(s) with no source in docs/ — the sidebar link will 404:`,
    ...lines,
    "  Add the page, or fix or remove the entry in docu.json.",
  ].join("\n");
}
