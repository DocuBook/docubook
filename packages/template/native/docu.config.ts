export interface SocialLink {
  name: string;
  url: string;
}

export interface RepoConfig {
  url: string;
  path: string;
  edit: boolean;
}

export const repoConfig: RepoConfig = {
  url: "https://github.com/DocuBook/docubook",
  path: "blob/main/{filePath}",
  edit: true,
};

export const socialConfig: SocialLink[] = [
  { name: "gitHub", url: "https://github.com/DocuBook/docubook" },
  { name: "npm", url: "https://www.npmjs.com/~wildan.nrs" },
  { name: "youtube", url: "https://youtube.com/@wildandotdev" },
];

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

export function getSocialLinks(): SocialLink[] {
  return socialConfig;
}