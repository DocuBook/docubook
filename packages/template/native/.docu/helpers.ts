import { repoConfig, socialConfig } from "./docu.config";
import type { SocialLink } from "./types";

export function getEditLink(url: string, filePath: string): string {
  const configPath = repoConfig?.path || "blob/main/{filePath}";
  return `${url}/${configPath}`.replace("{filePath}", filePath);
}

export function isEditEnabled(): boolean {
  return repoConfig?.edit ?? false;
}

export function getRepoUrl(): string {
  return repoConfig?.url || "";
}

export function getSocialLinks(): SocialLink[] {
  return socialConfig || [];
}