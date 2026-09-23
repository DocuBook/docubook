import type { DocuRoute, DocuConfig } from "./types";
import { loadDocuConfig, resolveBasePath } from "./paths";
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
