import type { DocuRoute, DocuConfig } from "./types";
import docuConfig from "../../docu.json" with { type: "json" };

export const routes: DocuRoute[] = docuConfig.routes || [];
export const config = docuConfig as unknown as DocuConfig;
