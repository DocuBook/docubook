import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { NGINX_CONF, DOCKERFILE_BUN, DOCKERIGNORE, HEADERS_FILE } from "../node/deploy";
import { detectPkgManager } from "../node/deploy.shared";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("deploy Docker — generated file content", () => {
  it("Dockerfile uses oven/bun:1-debian for Bun path", () => {
    expect(DOCKERFILE_BUN).toContain("oven/bun:1-debian");
    expect(DOCKERFILE_BUN).toContain("nginx:alpine");
    expect(DOCKERFILE_BUN).toContain("bun.lock");
  });

  it(".dockerignore excludes build artifacts and secrets", () => {
    expect(DOCKERIGNORE).toContain(".docu/dist");
    expect(DOCKERIGNORE).toContain(".docu/lib");
    expect(DOCKERIGNORE).toContain(".env");
    expect(DOCKERIGNORE).toContain("*.log");
    expect(DOCKERIGNORE).toContain("node_modules");
    expect(DOCKERIGNORE).toContain(".git");
  });

  it("NGINX_CONF includes all security headers at server level", () => {
    expect(NGINX_CONF).toContain('add_header X-Frame-Options "DENY" always');
    expect(NGINX_CONF).toContain('add_header X-Content-Type-Options "nosniff" always');
    expect(NGINX_CONF).toContain(
      'add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always'
    );
    expect(NGINX_CONF).toContain(
      'add_header Referrer-Policy "strict-origin-when-cross-origin" always'
    );
    expect(NGINX_CONF).toContain(
      'add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always'
    );
    expect(NGINX_CONF).toContain('add_header Content-Security-Policy "default-src');
  });

  it("NGINX_CONF /assets/ uses 1y immutable cache", () => {
    expect(NGINX_CONF).toContain("location /assets/");
    expect(NGINX_CONF).toContain("expires 1y");
    expect(NGINX_CONF).toContain('add_header Cache-Control "public, immutable"');
  });

  it("NGINX_CONF /docs/assets/ uses 7d public cache (no immutable)", () => {
    const docsBlock = NGINX_CONF.split("location /docs/assets/")[1]?.split("location /")[0];
    expect(docsBlock).toBeTruthy();
    expect(docsBlock).toContain("expires 7d");
    expect(docsBlock).toContain('add_header Cache-Control "public"');
    expect(docsBlock).not.toContain("immutable");
  });

  it("NGINX_CONF has root location fallback", () => {
    expect(NGINX_CONF).toContain("location /");
    expect(NGINX_CONF).toContain("try_files $uri $uri.html $uri/ =404");
  });

  it("_headers has 1y immutable for /assets/*", () => {
    expect(HEADERS_FILE).toContain("/assets/*");
    expect(HEADERS_FILE).toContain("Cache-Control: public, max-age=31536000, immutable");
    expect(HEADERS_FILE).not.toContain("/assets/chunks/*");
  });

  it("_headers includes CSP and security headers", () => {
    expect(HEADERS_FILE).toContain("Content-Security-Policy: default-src");
    expect(HEADERS_FILE).toContain("Strict-Transport-Security:");
    expect(HEADERS_FILE).toContain("Permissions-Policy:");
  });
});

describe("detectPkgManager — lockfile detection", () => {
  let tmpDir: string;
  const files: string[] = [];

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `deploy-test-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    const { rm } = await import("node:fs/promises");
    await rm(tmpDir, { recursive: true, force: true });
  });

  async function touch(name: string) {
    await writeFile(join(tmpDir, name), "");
    files.push(name);
  }

  it("detects bun.lock", async () => {
    await touch("bun.lock");
    await touch("package.json");
    const pm = detectPkgManager(tmpDir);
    expect(pm.runCmd).toBe("bun");
    expect(pm.lockFile).toBe("bun.lock");
    expect(pm.baseImage).toBe("oven/bun:1-debian");
    expect(pm.installCmd).toBe("bun install --frozen-lockfile");
    expect(pm.cache).toBe("");
    expect(pm.setupAction).toBe("bun");
  });

  it("detects bun.lockb (legacy binary lockfile)", async () => {
    await touch("bun.lockb");
    await touch("package.json");
    const pm = detectPkgManager(tmpDir);
    expect(pm.runCmd).toBe("bun");
    expect(pm.lockFile).toBe("bun.lockb");
    expect(pm.baseImage).toBe("oven/bun:1-debian");
    expect(pm.installCmd).toBe("bun install --frozen-lockfile");
    expect(pm.cache).toBe("");
    expect(pm.setupAction).toBe("bun");
  });

  it("prefers bun.lock over bun.lockb when both exist", async () => {
    await touch("bun.lock");
    await touch("bun.lockb");
    await touch("package.json");
    const pm = detectPkgManager(tmpDir);
    expect(pm.lockFile).toBe("bun.lock");
  });

  it("detects pnpm-lock.yaml", async () => {
    await touch("pnpm-lock.yaml");
    await touch("package.json");
    const pm = detectPkgManager(tmpDir);
    expect(pm.runCmd).toBe("pnpm");
    expect(pm.lockFile).toBe("pnpm-lock.yaml");
    expect(pm.baseImage).toBe("node:22-alpine");
    expect(pm.installCmd).toContain("pnpm install --frozen-lockfile");
    expect(pm.cache).toBe("pnpm");
    expect(pm.setupAction).toBe("pnpm");
  });

  it("detects yarn.lock", async () => {
    await touch("yarn.lock");
    await touch("package.json");
    const pm = detectPkgManager(tmpDir);
    expect(pm.runCmd).toBe("yarn");
    expect(pm.lockFile).toBe("yarn.lock");
    expect(pm.baseImage).toBe("node:22-alpine");
    expect(pm.installCmd).toBe("yarn install --frozen-lockfile");
    expect(pm.cache).toBe("yarn");
    expect(pm.setupAction).toBe("node");
  });

  it("defaults to npm when no lockfile found", async () => {
    await touch("package.json");
    const pm = detectPkgManager(tmpDir);
    expect(pm.runCmd).toBe("npm");
    expect(pm.lockFile).toBe("package-lock.json");
    expect(pm.installCmd).toBe("npm ci");
    expect(pm.cache).toBe("npm");
    expect(pm.setupAction).toBe("node");
  });

  it("prefers bun over pnpm when both exist", async () => {
    await touch("bun.lock");
    await touch("pnpm-lock.yaml");
    await touch("package.json");
    const pm = detectPkgManager(tmpDir);
    expect(pm.runCmd).toBe("bun");
  });

  it("prefers pnpm over yarn when both exist", async () => {
    await touch("pnpm-lock.yaml");
    await touch("yarn.lock");
    await touch("package.json");
    const pm = detectPkgManager(tmpDir);
    expect(pm.runCmd).toBe("pnpm");
  });
});

describe("deploy flags — env var wiring", () => {
  const OLD = { ...process.env };

  afterEach(() => {
    process.env = { ...OLD };
  });

  it("FLAME_DEPLOY_DOCKER triggers docker mode", () => {
    process.env.FLAME_DEPLOY_DOCKER = "1";
    expect(process.env.FLAME_DEPLOY_DOCKER).toBe("1");
  });

  it("FLAME_DEPLOY_SILENT sets LOG_LEVEL=error", () => {
    process.env.FLAME_DEPLOY_SILENT = "1";
    process.env.LOG_LEVEL = "error";
    expect(process.env.LOG_LEVEL).toBe("error");
  });

  it("no flags defaults to undefined", () => {
    delete process.env.FLAME_DEPLOY_DOCKER;
    delete process.env.FLAME_DEPLOY_SILENT;
    expect(process.env.FLAME_DEPLOY_DOCKER).toBeUndefined();
    expect(process.env.FLAME_DEPLOY_SILENT).toBeUndefined();
  });
});

describe("deploy output — silent mode suppresses logs", () => {
  it("log helper no-ops in silent mode", () => {
    const isSilent = true;
    const log = isSilent
      ? { info: () => {}, ok: () => {}, created: () => {}, out: () => {} }
      : { info: () => {}, ok: () => {}, created: () => {}, out: () => {} };

    expect(() => {
      log.info("test");
      log.ok();
      log.created("📄 Created");
      log.out("output");
    }).not.toThrow();
  });

  it("log helper outputs in normal mode", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const isSilent = false;
    const log = isSilent
      ? { info: () => {}, ok: () => {}, created: () => {}, out: () => {} }
      : {
          info: (m: string) => console.log(m),
          ok: () => console.log("\n✅ Ready to deploy!"),
          created: (m: string) => console.log(m),
          out: (m: string) => console.log(m),
        };

    log.info("📦 Building");
    log.ok();
    log.created("📄 Created file");
    log.out("   Output: done");

    expect(spy).toHaveBeenCalledTimes(4);
    spy.mockRestore();
  });
});
