import docuConfig from "../../docu.json" with { type: "json" };
import type { SocialLink } from "./types";

export function getEditLink(url: string, filePath: string): string {
  const configPath = docuConfig?.repo?.path || "blob/main/{filePath}";
  return `${url}/${configPath}`.replace("{filePath}", filePath);
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