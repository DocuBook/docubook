import type { DocuConfig } from "./types";
import { resolveBasePath } from "./base-path";
import type { BasePathIssue } from "./base-path";

/**
 * Pure helpers for the `experimental` section of `docu.json`.
 *
 * Like `./base-path`, this module MUST stay free of Node built-ins and of
 * modules that evaluate them at import time: `./paths` re-exports it for the
 * server side, and the client bundle may pull it in through shared code.
 *
 * `experimental.pages` — the project brings its own landing page. Flame then
 * keeps everything it builds under `meta.basePath`:
 *
 * - no landing page and no landing bundle; `home` in `docu.json` is ignored
 * - the 404 page moves to `<basePath>/404.html`, so it never replaces the
 *   project's own root 404
 * - hashed bundles, the asset manifest and the search index move from the
 *   dist-root `assets/` to `<basePath>/_flame/`, so they never collide with
 *   the project's own `/assets/` (Vite's default output directory)
 *
 * One route rule for the prefix (`/docs/*`) is then enough to serve the docs
 * next to any other app on the same origin. With the flag off nothing changes.
 */
export function resolveOwnPages(config?: DocuConfig | null): boolean {
  return config?.experimental?.pages === true;
}

/**
 * Validate the `experimental` section.
 *
 * A non-boolean `pages` value cannot be honored and is an error. Two things
 * next to an enabled flag are warnings — the config still builds, but not
 * the way the author most likely meant:
 *
 * - a `home` section, which no longer renders anything
 * - a root `meta.basePath` (`""` or `"/"`): the docs then own `/`,
 *   `index.html`, `404.html` and every page at the dist root, so they cannot
 *   share the origin with the project's own app. A docs-only site without a
 *   landing page is a valid reason to do this, so it is not an error.
 */
export function validateOwnPages(config?: DocuConfig | null): BasePathIssue[] {
  const issues: BasePathIssue[] = [];
  const experimental = (config as { experimental?: unknown } | null | undefined)?.experimental;
  if (experimental === undefined) return issues;
  if (experimental === null || typeof experimental !== "object" || Array.isArray(experimental)) {
    issues.push({
      level: "error",
      message: `"experimental" must be an object (got ${describe(experimental)})`,
    });
    return issues;
  }
  const pages = (experimental as { pages?: unknown }).pages;
  if (pages !== undefined && typeof pages !== "boolean") {
    issues.push({
      level: "error",
      message: `"experimental.pages" must be a boolean (got ${describe(pages)})`,
    });
    return issues;
  }
  if (pages === true && config?.home !== undefined) {
    issues.push({
      level: "warning",
      message:
        '"experimental.pages" is enabled, so the "home" section of docu.json is ignored — ' +
        "the landing page is yours to build. Remove it to silence this warning.",
    });
  }
  if (pages === true && resolveBasePath(config) === "") {
    issues.push({
      level: "warning",
      message:
        `"experimental.pages" is enabled with a root "meta.basePath" ` +
        `(${JSON.stringify(config?.meta?.basePath)}): the docs own "/", index.html, 404.html ` +
        "and every page at the dist root, so they cannot share the origin with your own app. " +
        'Set a prefix such as "/docs" to serve them next to it.',
    });
  }
  return issues;
}

function describe(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  return typeof value;
}

/** Directory name of the bundle tree under the docs prefix when the project
 *  brings its own pages. Underscore-led so it cannot shadow a docs page or the
 *  content `assets/` copied from `docs/assets`. */
export const OWN_PAGES_BUNDLE_DIR = "_flame";

/**
 * URL path (from the dist root, no trailing slash) of the hashed bundles, the
 * asset manifest and the search index.
 *
 * `/assets` by default — shared by every page at the dist root, as it always
 * was. Under the flag it moves inside the docs prefix (`/docs/_flame`, or
 * `/_flame` at a root deployment) so the build owns nothing outside it.
 */
export function resolveBundlePath(ownPages: boolean, basePath: string): string {
  return ownPages ? `${basePath}/${OWN_PAGES_BUNDLE_DIR}` : "/assets";
}

/**
 * URL path (from the dist root) of the generated 404 page: the dist root by
 * default, inside the docs prefix under the flag — the root 404 belongs to the
 * project then. At a root deployment the two are the same file.
 */
export function resolveNotFoundPath(ownPages: boolean, basePath: string): string {
  return ownPages ? `${basePath}/404.html` : "/404.html";
}

/**
 * What answers `/` in the dev and preview servers.
 *
 * - `landing`: the generated landing page (flag off — today's behavior).
 * - `docs-index`: the docs index. With the flag on and the docs at the
 *   deployment root (`basePath: ""`) nothing else can own `/`, and the build
 *   writes `docs/index.mdx` to `dist/index.html` for the same reason.
 * - `{ redirect }`: the docs prefix. In production `/` belongs to the project's
 *   own pages, which these servers do not serve — sending the browser to the
 *   docs is more useful than a 404.
 */
export type RootRoute = "landing" | "docs-index" | { redirect: string };

export function resolveRootRoute(ownPages: boolean, basePath: string): RootRoute {
  if (!ownPages) return "landing";
  if (basePath.length === 0) return "docs-index";
  return { redirect: basePath };
}

/**
 * Environment variable that marks a build as the whole deployment — Flame is
 * the only thing the host serves (GitHub Pages via `flame deploy`). With the
 * flag on and a docs prefix, such a build also writes a root `index.html` that
 * redirects to the docs and a root `404.html`, because the host has no other
 * pages and no way to configure either. A plain `flame build` never does.
 */
export const STANDALONE_ENV = "FLAME_STANDALONE";

/** Whether a build should write the standalone root entry points. Only
 *  meaningful under the flag with a docs prefix; a no-op everywhere else. */
export function needsStandaloneRoot(ownPages: boolean, basePath: string): boolean {
  return ownPages && basePath.length > 0;
}

/**
 * Root `index.html` for a standalone deployment: a meta refresh to the docs
 * prefix. Static hosts like GitHub Pages cannot answer with a redirect status,
 * so this is the only portable way. The target is relative, so it resolves
 * under whatever path the host serves the dist from (`/repo/` on a project
 * site) without knowing it. No script — the CSP stays untouched.
 */
export function redirectHtml(basePath: string): string {
  const target = `.${basePath}/`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Redirecting…</title>
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0; url=${target}">
</head>
<body>
  <a href="${target}">Continue to the documentation</a>
</body>
</html>
`;
}
