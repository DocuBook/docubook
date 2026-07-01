import { loadDocuConfig } from "./paths";
import type { SocialLink } from "./types";

const docuConfig = loadDocuConfig();

export function getEditLink(url: string, filePath: string): string {
  const configPath = docuConfig?.repo?.path || detectPlatformPath(url);
  const encodedPath = filePath.replace(/^\//, "").split("/").map(encodeURIComponent).join("/");
  return `${url}/${configPath}`.replace("{filePath}", encodedPath);
}

/**
 * Detect the default edit path template from the repo URL hostname.
 * Supports GitHub, GitLab, Bitbucket, Gitea (cloud + self-hosted),
 * Gogs, Forgejo, and Codeberg.
 * Falls back to Gitea-style for unknown hosts — override via repo.path.
 */
export function detectPlatformPath(url: string): string {
  try {
    const host = new URL(url).hostname;
    if (host === "github.com") return "blob/main/{filePath}";
    if (host === "gitlab.com") return "-/blob/main/{filePath}";
    if (host === "bitbucket.org") return "src/main/{filePath}";
    if (host === "gitea.com") return "src/branch/main/{filePath}";
    if (host === "codeberg.org") return "src/branch/main/{filePath}";
    // Gogs, Forgejo, or any self-hosted Gitea-compatible forge
    return "src/branch/main/{filePath}";
  } catch {
    return "blob/main/{filePath}";
  }
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
