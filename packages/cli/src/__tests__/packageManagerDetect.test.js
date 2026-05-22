import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("child_process", () => ({
  execFileSync: vi.fn(),
}));

const { execFileSync } = await import("child_process");
const { detectInstalledPackageManager } = await import("../utils/packageManagerDetect.js");

describe("detectInstalledPackageManager", () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env.npm_config_user_agent;
  });

  afterEach(() => {
    process.env.npm_config_user_agent = originalEnv;
    vi.resetAllMocks();
  });

  it("detects npm from user agent", () => {
    process.env.npm_config_user_agent = "npm/10.2.0 node/v20.10.0";
    expect(detectInstalledPackageManager()).toBe("npm");
  });

  it("detects pnpm from user agent", () => {
    process.env.npm_config_user_agent = "pnpm/9.1.0 node/v20.10.0";
    expect(detectInstalledPackageManager()).toBe("pnpm");
  });

  it("detects yarn from user agent", () => {
    process.env.npm_config_user_agent = "yarn/4.0.0 node/v20.10.0";
    expect(detectInstalledPackageManager()).toBe("yarn");
  });

  it("detects bun from user agent", () => {
    process.env.npm_config_user_agent = "bun/1.0.0";
    expect(detectInstalledPackageManager()).toBe("bun");
  });

  it("falls back to PATH detection when no user agent", () => {
    process.env.npm_config_user_agent = "";
    execFileSync.mockImplementation((cmd) => {
      if (cmd === "pnpm") return;
      throw new Error("not found");
    });
    expect(detectInstalledPackageManager()).toBe("pnpm");
  });

  it("returns npm when nothing is available", () => {
    process.env.npm_config_user_agent = "";
    execFileSync.mockImplementation(() => {
      throw new Error("not found");
    });
    expect(detectInstalledPackageManager()).toBe("npm");
  });
});
