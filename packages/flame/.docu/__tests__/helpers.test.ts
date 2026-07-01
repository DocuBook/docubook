import { describe, it, expect, vi } from "vitest";

// Mock paths module BEFORE any import of helpers, because helpers.ts calls
// loadDocuConfig() at module scope (top-level constant).
vi.mock("../node/paths", () => ({
  loadDocuConfig: vi.fn(() => ({
    repo: { url: "", path: "", edit: false },
    footer: { social: [] },
  })),
}));

import {
  detectPlatformPath,
  getEditLink,
  isEditEnabled,
  getRepoUrl,
  getSocialLinks,
} from "../node/helpers";

// ---------------------------------------------------------------------------
// detectPlatformPath — pure function, no config dependency
// ---------------------------------------------------------------------------
describe("detectPlatformPath", () => {
  it("returns GitHub blob path for github.com", () => {
    expect(detectPlatformPath("https://github.com/owner/repo")).toBe("blob/main/{filePath}");
  });

  it("returns GitLab blob path for gitlab.com", () => {
    expect(detectPlatformPath("https://gitlab.com/owner/repo")).toBe("-/blob/main/{filePath}");
  });

  it("returns Bitbucket src path for bitbucket.org", () => {
    expect(detectPlatformPath("https://bitbucket.org/owner/repo")).toBe("src/main/{filePath}");
  });

  it("returns Gitea/Gogs fallback for self-hosted forge (unknown host)", () => {
    expect(detectPlatformPath("https://gitea.example.com/owner/repo")).toBe(
      "src/branch/main/{filePath}"
    );
  });

  it("returns Gitea path for gitea.com (cloud)", () => {
    expect(detectPlatformPath("https://gitea.com/owner/repo")).toBe("src/branch/main/{filePath}");
  });

  it("returns Forgejo path for codeberg.org", () => {
    expect(detectPlatformPath("https://codeberg.org/owner/repo")).toBe(
      "src/branch/main/{filePath}"
    );
  });

  it("falls back to GitHub-style for an invalid/non-URL string", () => {
    expect(detectPlatformPath("not-a-url")).toBe("blob/main/{filePath}");
  });

  it("falls back to GitHub-style for an empty string", () => {
    expect(detectPlatformPath("")).toBe("blob/main/{filePath}");
  });
});

// ---------------------------------------------------------------------------
// getEditLink
// Note: docuConfig is captured at module init time, so these tests verify the
// logic paths reachable from the single module-level config snapshot.
// We use a shared config (set once per describe) to cover each branch.
// ---------------------------------------------------------------------------
describe("getEditLink — uses detectPlatformPath when repo.path is empty", () => {
  it("builds GitHub edit link for docs/intro.mdx", () => {
    // Default mock has repo.path = "" → falls through to detectPlatformPath
    const result = getEditLink("https://github.com/owner/repo", "docs/intro.mdx");
    expect(result).toBe("https://github.com/owner/repo/blob/main/docs/intro.mdx");
  });

  it("strips leading slash from filePath", () => {
    const result = getEditLink("https://github.com/owner/repo", "/docs/intro.mdx");
    expect(result).toBe("https://github.com/owner/repo/blob/main/docs/intro.mdx");
  });

  it("encodes spaces in filePath segments", () => {
    const result = getEditLink(
      "https://github.com/owner/repo",
      "docs/getting started/intro file.mdx"
    );
    expect(result).toBe(
      "https://github.com/owner/repo/blob/main/docs/getting%20started/intro%20file.mdx"
    );
  });

  it("builds GitLab edit link", () => {
    const result = getEditLink("https://gitlab.com/owner/repo", "docs/api.mdx");
    expect(result).toBe("https://gitlab.com/owner/repo/-/blob/main/docs/api.mdx");
  });

  it("builds Bitbucket edit link", () => {
    const result = getEditLink("https://bitbucket.org/owner/repo", "docs/api.mdx");
    expect(result).toBe("https://bitbucket.org/owner/repo/src/main/docs/api.mdx");
  });
});

// ---------------------------------------------------------------------------
// isEditEnabled — reads from module-level docuConfig
// ---------------------------------------------------------------------------
describe("isEditEnabled", () => {
  it("returns false with the default mock (edit: false)", () => {
    expect(isEditEnabled()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getRepoUrl — reads from module-level docuConfig
// ---------------------------------------------------------------------------
describe("getRepoUrl", () => {
  it("returns empty string with the default mock (url: '')", () => {
    expect(getRepoUrl()).toBe("");
  });
});

// ---------------------------------------------------------------------------
// getSocialLinks — reads from module-level docuConfig
// ---------------------------------------------------------------------------
describe("getSocialLinks", () => {
  it("returns empty array with the default mock (social: [])", () => {
    expect(getSocialLinks()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Integration: verify detectPlatformPath drives getEditLink correctly
// for all supported hosts — using only the pure function path.
// ---------------------------------------------------------------------------
describe("getEditLink — platform integration via detectPlatformPath", () => {
  const cases = [
    {
      label: "github.com",
      repoUrl: "https://github.com/org/repo",
      filePath: "guide/intro.mdx",
      expected: "https://github.com/org/repo/blob/main/guide/intro.mdx",
    },
    {
      label: "gitlab.com",
      repoUrl: "https://gitlab.com/org/repo",
      filePath: "guide/intro.mdx",
      expected: "https://gitlab.com/org/repo/-/blob/main/guide/intro.mdx",
    },
    {
      label: "bitbucket.org",
      repoUrl: "https://bitbucket.org/org/repo",
      filePath: "guide/intro.mdx",
      expected: "https://bitbucket.org/org/repo/src/main/guide/intro.mdx",
    },
    {
      label: "gitea.com (cloud)",
      repoUrl: "https://gitea.com/org/repo",
      filePath: "guide/intro.mdx",
      expected: "https://gitea.com/org/repo/src/branch/main/guide/intro.mdx",
    },
    {
      label: "codeberg.org (Forgejo)",
      repoUrl: "https://codeberg.org/org/repo",
      filePath: "guide/intro.mdx",
      expected: "https://codeberg.org/org/repo/src/branch/main/guide/intro.mdx",
    },
    {
      label: "self-hosted gitea",
      repoUrl: "https://gitea.myorg.io/org/repo",
      filePath: "guide/intro.mdx",
      expected: "https://gitea.myorg.io/org/repo/src/branch/main/guide/intro.mdx",
    },
  ];

  for (const { label, repoUrl, filePath, expected } of cases) {
    it(`builds correct URL for ${label}`, () => {
      expect(getEditLink(repoUrl, filePath)).toBe(expected);
    });
  }
});
