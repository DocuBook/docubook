export { cn, parseDate, formatDate, formatDate2 } from "@docubook/core";
export {
  withBasePath,
  assetHref,
  applyBasePath,
  rebaseContentPath,
  stripDocsHtmlSuffix,
  matchDocsSlug,
  withDeployPath,
  stripDeployPath,
} from "./base-path";

import { DEFAULT_BASE_PATH, isDocsPath, rebaseContentPath, withDeployPath } from "./base-path";

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
 * Any URL with a scheme (`https:`, `mailto:`) or protocol-relative (`//host`).
 * Wider than {@link isExternalUrl}: a `routes` entry may link to anything that
 * is not a docs path.
 */
export function hasUrlScheme(href: string): boolean {
  return /^([a-z][a-z\d+.-]*:|\/\/)/i.test(href);
}

/**
 * Split a docs path from its `?query`/`#fragment`, e.g. `/docs/intro#setup`
 * into `/docs/intro` and `#setup`.
 */
export function splitPathSuffix(path: string): { pathname: string; suffix: string } {
  const cut = path.search(/[?#]/);
  return cut === -1
    ? { pathname: path, suffix: "" }
    : { pathname: path.slice(0, cut), suffix: path.slice(cut) };
}

/**
 * Link for a sidebar `routes` entry whose path is already composed under the
 * docs prefix. Like {@link docsHtmlHref} it takes the `.html` suffix, but a
 * `?query` or `#fragment` stays after it (`/docs/intro.html#setup`), and a URL
 * with a scheme passes through untouched.
 */
export function sidebarLinkHref(fullHref: string): string {
  if (hasUrlScheme(fullHref)) return fullHref;
  const { pathname, suffix } = splitPathSuffix(fullHref);
  return `${docsHtmlHref(pathname)}${suffix}`;
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
 *
 * `deploymentPath` (see `withDeployPath`) is prepended to links that point
 * into the dist — docs pages and the landing page `/` — so they keep working
 * when the host serves the dist under a path. Omit it to get the
 * deployment-free route, e.g. for active-state comparisons.
 */
export function docsNavHref(
  link: string,
  resolvedBasePath: string = DEFAULT_BASE_PATH,
  deploymentPath: string = ""
): string {
  if (isExternalUrl(link) || !link.startsWith("/")) return link;

  const cut = link.search(/[?#]/);
  const suffix = cut === -1 ? "" : link.slice(cut);
  const pathname = (cut === -1 ? link : link.slice(0, cut)).replace(/\/+$/, "") || "/";

  // The landing page lives at the dist root.
  if (pathname === "/") return withDeployPath(`/${suffix}`, deploymentPath);

  // Sibling routes on the same origin are not docs pages — leave them verbatim.
  if (!isDocsPath(pathname, resolvedBasePath)) return link;

  const rebased = rebaseContentPath(pathname, resolvedBasePath);

  // The docs root is a directory index, and anything with an extension is
  // already a file — neither takes the `.html` suffix.
  if (rebased === "/" || rebased === resolvedBasePath || /\.[a-z0-9]+$/i.test(rebased)) {
    return withDeployPath(`${rebased}${suffix}`, deploymentPath);
  }
  return withDeployPath(`${rebased}.html${suffix}`, deploymentPath);
}

/**
 * Resolve an authored content asset path from `docu.json` (e.g. the navbar
 * logo, `/docs/assets/images/logo.svg`) for the deployment: re-based onto the
 * configured prefix and placed under the deployment path. Same rules as
 * content images in MDX; external URLs and non-docs paths pass through.
 */
export function docsAssetSrc(
  src: string,
  resolvedBasePath: string = DEFAULT_BASE_PATH,
  deploymentPath: string = ""
): string {
  if (isExternalUrl(src) || !src.startsWith("/") || !isDocsPath(src, resolvedBasePath)) return src;
  return withDeployPath(rebaseContentPath(src, resolvedBasePath), deploymentPath);
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
