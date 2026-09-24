import type { DocuRoute, DocuConfig } from "./types";
import { loadDocuConfig, resolveBasePath, resolveDeployPath } from "./paths";
import { resolveRoutes } from "./fs-scanner";

const docuConfig = loadDocuConfig();
export const routes: DocuRoute[] = resolveRoutes(docuConfig.routes || []);
export const config = docuConfig as unknown as DocuConfig;

/**
 * URL prefix the site is served under (`""` at the domain root, else `/prefix`).
 * Components use this instead of assuming `/docs`, so a subpath deployment does
 * not request assets from the domain root.
 */
export const basePath: string = resolveBasePath(docuConfig);

/**
 * Path the host serves the dist root under (`""` at an origin root, `/repo` for
 * a GitHub Pages project site — see `resolveDeployPath`). Root-absolute browser
 * requests (the search index) build their URL from it, because the client
 * bundle cannot read `docu.json` at runtime.
 */
export const deployPath: string = resolveDeployPath(docuConfig);
