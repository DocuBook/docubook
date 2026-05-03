export interface RepoConfig {
  url: string;
  path?: string;
  edit?: boolean;
}

export const repoConfig: RepoConfig = {
  url: "",
  path: "blob/main/{filePath}",
  edit: false,
};

export function getEditLink(url: string, filePath: string): string {
  const path = repoConfig.path || "blob/main/{filePath}";
  return `${url}/${path}`.replace("{filePath}", filePath);
}

export function isEditEnabled(): boolean {
  return repoConfig.edit ?? false;
}

export function getRepoUrl(): string {
  return repoConfig.url || "";
}