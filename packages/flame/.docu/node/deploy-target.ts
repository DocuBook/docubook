/**
 * Where a build will be published, when Flame itself set up the deploy.
 *
 * Pure: no Node built-ins, so `./paths` can re-export it and tests can use it
 * directly. Kept apart from `./experimental` on purpose: `STANDALONE_ENV`
 * belongs to `experimental.pages` (a root redirect and 404 for a dist that has
 * no landing page), while this describes the host, for every project.
 *
 * Clean URLs are a platform setting, so `docu.json` has no option for them.
 * Only a host Flame deploys to with no configuration of its own needs telling
 * apart: GitHub Pages serves files by exact path, so `/docs/page` 404s and
 * only `/docs/page.html` works. Every other host either strips `.html` (often
 * with a 308 from `/page.html` to `/page`) or is configured to, which is why
 * extensionless canonical URLs stay the default.
 */

/** Environment variable the generated deploy flows set for the build. */
export const DEPLOY_TARGET_ENV = "FLAME_DEPLOY_TARGET";

/** The deploy targets Flame knows about. */
export type DeployTarget = "github-pages";

/** The target named by the env value, or `undefined` for none or an unknown one. */
export function resolveDeployTarget(value: string | undefined): DeployTarget | undefined {
  return value === "github-pages" ? value : undefined;
}

/**
 * Whether canonical and `og:url` URLs of docs pages must carry `.html` on this
 * target — true where the host has no clean URLs.
 */
export function canonicalNeedsHtml(target: DeployTarget | undefined): boolean {
  return target === "github-pages";
}
