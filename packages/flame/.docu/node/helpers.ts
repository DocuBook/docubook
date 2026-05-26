import { loadDocuConfig } from "./paths";
import type { SocialLink } from "./types";

const docuConfig = loadDocuConfig();

export function getEditLink(url: string, filePath: string): string {
  const configPath = docuConfig?.repo?.path || "blob/main/{filePath}";
  const encodedPath = filePath.replace(/^\//, "").split("/").map(encodeURIComponent).join("/");
  return `${url}/${configPath}`.replace("{filePath}", encodedPath);
}

export function isEditEnabled(): boolean {
  return docuConfig?.repo?.edit ?? false;
}

export function getRepoUrl(): string {
  return docuConfig?.repo?.url || "";
}

export function getSocialLinks(): SocialLink[] {
  return docuConfig?.footer?.social || [];
}
