import type { DocuRoute, DocuConfig } from "./types";
import { loadDocuConfig } from "./paths";
import { resolveRoutes } from "./fs-scanner";

const docuConfig = loadDocuConfig();
export const routes: DocuRoute[] = resolveRoutes(docuConfig.routes || []);
export const config = docuConfig as unknown as DocuConfig;
