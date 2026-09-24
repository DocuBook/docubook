export { cn, parseDate, formatDate, formatDate2 } from "@docubook/core";
export {
  withBasePath,
  assetHref,
  applyBasePath,
  rebaseContentPath,
  stripDocsHtmlSuffix,
  matchDocsSlug,
} from "./base-path";

import { DEFAULT_BASE_PATH, isDocsPath, rebaseContentPath } from "./base-path";

/**
 * Client-safe utilities shared by SSR and the browser bundle.
 *
 * This module MUST NOT import Node built-ins (`node:fs`, `node:path`, ...):
 * Bun's bundler injects a `node:path` polyfill into browser builds for any
 * bundled module that imports it. Filesystem/git helpers live in
 * `./server-utils` (server-only).
 */

export function isExternalUrl(url: string): boolean {
  return /^(https?:\/\/|\/\/)/.test(url);
}

/** Suffix an internal docs link with `.html` to match the flat static build output. */
export function docsHtmlHref(path: string): string {
  return `${path}.html`;
}

/**
 * Resolve an authored nav/menu link for the current deployment.
 *
 * Docs pages ship as flat `.html` files, so `/docs/guide/routing` has to request
 * `/docs/guide/routing.html`, while the docs root itself stays a directory index
 * and keeps no suffix. Authored `/docs/...` paths are re-based onto the
 * configured prefix, so one `docu.json` keeps working at a custom subpath
 * (`/repo`) or at a root deployment (`""`). External URLs, hash targets and
 * paths that already name a file pass through untouched.
 */
export function docsNavHref(link: string, resolvedBasePath: string = DEFAULT_BASE_PATH): string {
  if (isExternalUrl(link) || !link.startsWith("/")) return link;

  const cut = link.search(/[?#]/);
  const suffix = cut === -1 ? "" : link.slice(cut);
  const pathname = (cut === -1 ? link : link.slice(0, cut)).replace(/\/+$/, "") || "/";

  // Sibling routes on the same origin are not docs pages — leave them verbatim.
  if (!isDocsPath(pathname, resolvedBasePath)) return link;

  const rebased = rebaseContentPath(pathname, resolvedBasePath);

  // The docs root is a directory index, and anything with an extension is
  // already a file — neither takes the `.html` suffix.
  if (rebased === "/" || rebased === resolvedBasePath || /\.[a-z0-9]+$/i.test(rebased)) {
    return `${rebased}${suffix}`;
  }
  return `${rebased}.html${suffix}`;
}

/**
 * Does `pathname` refer to a link returned by {@link docsNavHref}?
 *
 * Nav links reach the browser in two forms: the generated `.html` URL and the
 * extensionless route a visitor may have typed (the dev server maps both), so
 * active states have to accept the pair.
 */
export function docsNavActive(pathname: string, href: string): boolean {
  const extensionless = href.endsWith(".html") ? href.slice(0, -".html".length) : href;
  return (
    pathname === href || pathname === extensionless || pathname.startsWith(`${extensionless}/`)
  );
}

export function getPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch (err) {
    console.error("Failed to parse URL", url, err);
    return url;
  }
}
