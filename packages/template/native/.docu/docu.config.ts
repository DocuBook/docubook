import type { RepoConfig, SocialLink } from "./types";

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