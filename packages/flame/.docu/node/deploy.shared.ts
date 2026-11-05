/**
 * Runtime-neutral deploy — 3 modes:
 *   1. `flame deploy`           → build + generate GitHub Actions workflow
 *   2. `flame deploy --docker`  → build + generate Docker deployment files
 *   3. `flame deploy --docker --silent` → same as #2, minimal output
 *
 * Mirror of deploy.ts (Bun-only, protected) for Node.js and Deno.
 * Runs the neutral build in-process, then prepares .docu/dist.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  DIST_DIR,
  PROJECT_ROOT,
  FRAMEWORK_ROOT,
  servedBasePath,
  ownPages,
  basePath,
  bundlePath,
  needsStandaloneRoot,
  STANDALONE_ENV,
  OWN_PAGES_BUNDLE_DIR,
  DEPLOY_TARGET_ENV,
} from "./paths";

const FLAME_VERSION = JSON.parse(
  readFileSync(resolve(FRAMEWORK_ROOT, "package.json"), "utf-8")
).version;

const WORKFLOW_DIR = join(PROJECT_ROOT, ".github/workflows");
const WORKFLOW_FILE = join(WORKFLOW_DIR, "deploy.yml");

/** Options for {@link buildNginxConf} beyond the docs prefix. */
export interface NginxConfOptions {
  /** URL path of the bundle tree (no trailing slash). Defaults to `/assets`. */
  bundlePath?: string;
  /**
   * `experimental.pages`: the generated 404 lives inside the docs prefix and
   * there is no landing page. Flame is still the whole site inside the image,
   * so `/` redirects to the docs instead of answering 404.
   */
  ownPages?: boolean;
}

/**
 * Nginx config for `flame deploy --docker`.
 *
 * Two distinct asset trees:
 *  - the bundle tree — hash-named client bundles, immutable. At the dist root
 *    (`/assets/`) by default, under the docs prefix (`/docs/_flame/`) with
 *    `experimental.pages`.
 *  - `<prefix>/assets/` — user content assets copied from `docs/assets`,
 *    revalidated after 7d.
 *
 * When both trees land on the same path (the default bundle tree at a root
 * deployment) nginx rejects duplicate location blocks — so the content tree is
 * omitted and the immutable bundle rules win. Non-hashed content assets then
 * inherit the 1y immutable header; that is a deliberate trade for a valid
 * config, and root deployments are the uncommon case. Under the flag the
 * bundle tree is `/_flame/`, so the two never collide.
 */
export function buildNginxConf(basePath: string, options: NginxConfOptions = {}): string {
  const { bundlePath = "/assets", ownPages = false } = options;
  // nginx `location` names must be plain URI prefixes; anything else (spaces,
  // braces, semicolons) fails `nginx -t` and the container never starts.
  // Unsafe prefixes simply lose the content-assets cache block — the default
  // location still serves the files, the same trade root deployments make.
  const safePrefix = /^\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/.test(basePath);
  if (basePath.length > 0 && !safePrefix) {
    console.warn(
      `[flame] basePath "${basePath}" contains characters nginx cannot use in a location block; ` +
        "omitting the content-assets caching block (assets still served)"
    );
  }
  const contentAssetsPath = `${basePath}/assets`;
  const contentAssetsBlock =
    (safePrefix || basePath.length === 0) && contentAssetsPath !== bundlePath
      ? `
  location ${contentAssetsPath}/ {
    expires 7d;
    add_header Cache-Control "public";
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:; connect-src 'self' https:; frame-src https://www.youtube-nocookie.com; frame-ancestors 'none'" always;
  }
`
      : "";
  // Root deployments under the flag publish the docs index at `/`; with a docs
  // prefix nothing in the image answers `/`, so send the browser to the docs.
  // Relative `Location`: an absolute one carries the container's own port (80),
  // which is wrong behind `docker run -p 8080:80`. Targeting the directory
  // directly also skips nginx's extra trailing-slash 301.
  const rootRedirect =
    ownPages && basePath.length > 0
      ? `
  location = / {
    absolute_redirect off;
    return 302 ${basePath}/;
  }
`
      : "";
  const notFound = ownPages ? `${basePath}/404.html` : "/404.html";

  return `server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;
  error_page 404 ${notFound};

  gzip on;
  gzip_types text/html text/css application/javascript image/svg+xml;

  # Security headers (HSTS effective when HTTPS is terminated upstream)
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:; connect-src 'self' https:; frame-src https://www.youtube-nocookie.com; frame-ancestors 'none'" always;

  # Build metadata and search content use stable URLs, so clients must revalidate them.
  location = ${bundlePath}/manifest.json {
    expires -1;
  }

  location = ${bundlePath}/search-index.json {
    expires -1;
  }

  # Generated JS, CSS, and chunks include content hashes in their filenames.
  location ${bundlePath}/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:; connect-src 'self' https:; frame-src https://www.youtube-nocookie.com; frame-ancestors 'none'" always;
  }
${contentAssetsBlock}
  location = ${notFound} { }
${rootRedirect}
  location / {
    try_files $uri $uri.html $uri/ =404;
  }
}
`;
}

/** Backward-compatible default config (root-level `/docs` prefix). */
export const NGINX_CONF = buildNginxConf("/docs");

export const DOCKERIGNORE = `node_modules
*.DS_Store
.docu/dist
.docu/lib
.env
.env.*
.npmrc
*.log
`;

/** Final stage shared by every generated Dockerfile: nginx serves the flat
 * static output produced by the builder stage. */
export const DOCKERFILE_MARKER = "# Generated by @docubook/flame deploy --docker";

const NGINX_STAGE = `FROM nginx:alpine
COPY --from=builder /app/.docu/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

/** Bun projects build inside the published builder image — the CLI is already
 * installed globally there, so no project dependency install step is needed. */
export const DOCKERFILE_BUN = `${DOCKERFILE_MARKER}
FROM ghcr.io/docubook/flame:${FLAME_VERSION} AS builder
ENV NODE_ENV=production
WORKDIR /app
COPY . .
RUN flame build --bun

${NGINX_STAGE}`;

export type PkgManagerConfig = {
  baseImage: string;
  lockFile: string;
  installCmd: string;
  runCmd: string;
  cache: string;
  setupAction: string;
};

/** Per-package-manager build config. `installCmd` is the locked install and
 * assumes `lockFile` exists — see `LOCKLESS_INSTALL` for projects without one. */
const PM_CONFIG: Record<string, PkgManagerConfig> = {
  bun: {
    baseImage: "oven/bun:1-debian",
    lockFile: "bun.lock",
    installCmd: "bun install --frozen-lockfile",
    runCmd: "bun",
    cache: "",
    setupAction: "bun",
  },
  pnpm: {
    baseImage: "node:22-alpine",
    lockFile: "pnpm-lock.yaml",
    installCmd: "corepack enable && pnpm install --frozen-lockfile",
    runCmd: "pnpm",
    cache: "pnpm",
    setupAction: "pnpm",
  },
  yarn: {
    baseImage: "node:22-alpine",
    lockFile: "yarn.lock",
    installCmd: "yarn install --frozen-lockfile",
    runCmd: "yarn",
    cache: "yarn",
    setupAction: "node",
  },
  npm: {
    baseImage: "node:22-alpine",
    lockFile: "package-lock.json",
    installCmd: "npm ci",
    runCmd: "npm",
    cache: "npm",
    setupAction: "node",
  },
};

/** Installs for projects with no lockfile, where `npm ci` and
 * `--frozen-lockfile` cannot run. */
const LOCKLESS_INSTALL: Record<string, string> = {
  bun: "bun install",
  pnpm: "corepack enable && pnpm install --prod=false",
  yarn: "yarn install --production=false",
  npm: "npm install --include=dev",
};

/** Build installs must include tools declared in devDependencies even though
 * the builder stage sets NODE_ENV=production for the eventual site build. */
function getInstallCommand(pm: PkgManagerConfig, hasLockFile: boolean): string {
  if (pm.runCmd === "npm") {
    return hasLockFile ? "npm ci --include=dev" : LOCKLESS_INSTALL.npm;
  }
  if (pm.runCmd === "pnpm" && hasLockFile) {
    return `${pm.installCmd} --prod=false`;
  }
  if (pm.runCmd === "yarn" && hasLockFile) {
    return `${pm.installCmd} --production=false`;
  }
  return hasLockFile ? pm.installCmd : LOCKLESS_INSTALL[pm.runCmd];
}

/**
 * Detect the project's package manager. Lockfiles win — they describe what the
 * project actually committed. `userAgent` (the invoking tool's
 * `npm_config_user_agent`) is only consulted when no lockfile exists, so a
 * lockless project still installs with the package manager the user is running.
 * pnpm/yarn UA strings also contain "npm/?" — match specific tools first.
 */
export function detectPkgManager(dir: string, userAgent = ""): PkgManagerConfig {
  const bunLockFile = existsSync(join(dir, "bun.lock"))
    ? "bun.lock"
    : existsSync(join(dir, "bun.lockb"))
      ? "bun.lockb"
      : null;
  if (bunLockFile) return { ...PM_CONFIG.bun, lockFile: bunLockFile };
  if (existsSync(join(dir, "pnpm-lock.yaml"))) return PM_CONFIG.pnpm;
  if (existsSync(join(dir, "yarn.lock"))) return PM_CONFIG.yarn;
  if (existsSync(join(dir, "package-lock.json"))) return PM_CONFIG.npm;

  if (/bun\//.test(userAgent)) return PM_CONFIG.bun;
  if (/pnpm\//.test(userAgent)) return PM_CONFIG.pnpm;
  if (/yarn\//.test(userAgent)) return PM_CONFIG.yarn;
  return PM_CONFIG.npm;
}

/**
 * Dockerfile for the project's package manager. Unlike the Bun builder image,
 * node-based images ship no project dependencies — without an install step the
 * build fails resolving imports from node_modules, so the locked dependencies
 * are installed before `flame` is invoked through the project's build script.
 * The lockfile and its frozen install are used only when the lockfile exists;
 * otherwise the install is derived from the invoking package manager.
 */
export function generateDockerfile(
  dir: string = PROJECT_ROOT,
  userAgent: string = process.env.npm_config_user_agent || ""
): string {
  const pm = detectPkgManager(dir, userAgent);
  if (pm.runCmd === "bun") return DOCKERFILE_BUN;

  const hasLockFile = existsSync(join(dir, pm.lockFile));

  return `${DOCKERFILE_MARKER}
FROM ${pm.baseImage} AS builder
ENV NODE_ENV=production
WORKDIR /app
COPY package.json${hasLockFile ? ` ${pm.lockFile}` : ""} ./
RUN ${getInstallCommand(pm, hasLockFile)}
COPY . .
RUN ${pm.runCmd} run build

${NGINX_STAGE}`;
}

/**
 * `_headers` (Netlify / Cloudflare Pages format) written next to the dist by
 * `flame deploy`. Cache rules follow the bundle tree: `/assets` by default,
 * `<basePath>/_flame` under `experimental.pages`.
 */
export function buildHeadersFile(bundlePath = "/assets"): string {
  return `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:; connect-src 'self' https:; frame-src https://www.youtube-nocookie.com; frame-ancestors 'none'

${bundlePath}/client-*
  Cache-Control: public, max-age=31536000, immutable
${bundlePath}/home-client-*
  Cache-Control: public, max-age=31536000, immutable
${bundlePath}/docs-*
  Cache-Control: public, max-age=31536000, immutable
${bundlePath}/site-*
  Cache-Control: public, max-age=31536000, immutable
${bundlePath}/chunks/*
  Cache-Control: public, max-age=31536000, immutable
${bundlePath}/assets/*
  Cache-Control: public, max-age=31536000, immutable
${bundlePath}/manifest.json
  Cache-Control: no-cache
${bundlePath}/search-index.json
  Cache-Control: no-cache
`;
}

export const HEADERS_FILE = buildHeadersFile();

const isDocker = !!process.env.FLAME_DEPLOY_DOCKER;

const isSilent = !!process.env.FLAME_DEPLOY_SILENT;
const isCi = !!process.env.FLAME_DEPLOY_CI;

/** Logger that no-ops all non-error output in silent mode. */
const log = isSilent
  ? { info: () => {}, ok: () => {}, created: () => {}, out: () => {} }
  : {
      info: (m: string) => console.log(m),
      ok: () => console.log("\n✅ Ready to deploy!"),
      created: (m: string) => console.log(m),
      out: (m: string) => console.log(m),
    };

async function runBuild() {
  process.env.NODE_ENV = "production";
  // GitHub Pages publishes the dist on its own: with `experimental.pages` the
  // build then also writes a root redirect and a root 404 (see STANDALONE_ENV).
  // The Docker image does not need them — its nginx config redirects instead.
  if (!isDocker) process.env[STANDALONE_ENV] = "1";
  // GitHub Pages has no clean URLs, so canonical URLs must name the `.html`
  // file (see ./deploy-target). nginx in the Docker image strips `.html`.
  if (!isDocker) process.env[DEPLOY_TARGET_ENV] = "github-pages";
  if (isSilent) {
    process.env.FLAME_BUILD_SILENT = "1";
    process.env.LOG_LEVEL = "error";
  }
  const { runBuildCli } = await import("./build.impl");
  await runBuildCli();
}

async function writeDockerFiles() {
  const dockerDir = PROJECT_ROOT;
  const dockerfilePath = join(dockerDir, "Dockerfile");

  if (!existsSync(dockerfilePath)) {
    await writeFile(dockerfilePath, generateDockerfile(dockerDir));
    log.created("📄 Created Dockerfile");
  } else if (readFileSync(dockerfilePath, "utf-8").startsWith(`${DOCKERFILE_MARKER}\n`)) {
    await writeFile(dockerfilePath, generateDockerfile(dockerDir));
    log.created("📄 Updated generated Dockerfile");
  } else {
    log.info(
      "⚠️  Dockerfile already exists; skipped it. Delete it and rerun flame deploy --docker to regenerate."
    );
  }

  const nginxPath = join(dockerDir, "nginx.conf");
  if (!existsSync(nginxPath)) {
    await writeFile(nginxPath, buildNginxConf(servedBasePath(), nginxOptions()));
    log.created("📄 Created nginx.conf");
  } else if (nginxConfIsStale(readFileSync(nginxPath, "utf-8"))) {
    log.info(
      `⚠️  nginx.conf does not serve ${bundlePath()}/ (the bundle path changes with experimental.pages); ` +
        "delete it and rerun flame deploy --docker to regenerate."
    );
  }

  if (!existsSync(join(dockerDir, ".dockerignore"))) {
    await writeFile(join(dockerDir, ".dockerignore"), DOCKERIGNORE);
    log.created("📄 Created .dockerignore");
  }
}

/** nginx options for the current project — the bundle tree and 404 follow
 *  `experimental.pages`. */
export function nginxOptions(): NginxConfOptions {
  return { bundlePath: bundlePath(), ownPages: ownPages() };
}

/**
 * Whether a kept nginx.conf was generated for the other bundle layout.
 *
 * Under `experimental.pages` a config that never mentions the moved bundle
 * tree predates the flag. Without the flag only a config that still points at
 * the flagged tree is stale. A hand-edited default config (a reworded
 * `location /assets/` block) is the user's own business and must not warn on
 * every deploy.
 */
export function nginxConfIsStale(
  conf: string,
  flagged: boolean = ownPages(),
  path: string = bundlePath()
): boolean {
  return flagged ? !conf.includes(`${path}/`) : conf.includes(`/${OWN_PAGES_BUNDLE_DIR}/`);
}

/** Whether a kept GitHub Pages workflow tells the build it deploys to GitHub Pages. */
export function workflowSetsDeployTarget(workflow: string): boolean {
  return new RegExp(`${DEPLOY_TARGET_ENV}:\\s*["']?github-pages`).test(workflow);
}

/**
 * Warnings for a GitHub Pages workflow `flame deploy` keeps instead of
 * regenerating. One generated by an older flame lacks the env the build now
 * reads: without the deploy target, canonical URLs omit `.html` and 404 on
 * GitHub Pages (every project); without standalone mode, an
 * `experimental.pages` site with a docs prefix has no root page.
 */
export function keptWorkflowWarnings(workflow: string, needsStandalone: boolean): string[] {
  const warnings: string[] = [];
  if (!workflowSetsDeployTarget(workflow)) {
    warnings.push(
      `⚠️  .github/workflows/deploy.yml builds without ${DEPLOY_TARGET_ENV}=github-pages, so ` +
        "canonical URLs omit .html and 404 on GitHub Pages. Add it to the build step's env, or " +
        "delete the file and rerun flame deploy."
    );
  }
  if (needsStandalone && !workflowIsStandalone(workflow)) {
    warnings.push(
      `⚠️  .github/workflows/deploy.yml builds without ${STANDALONE_ENV}=1, so the published site ` +
        "has no root page under experimental.pages. Add it to the build step's env, or delete the " +
        "file and rerun flame deploy."
    );
  }
  return warnings;
}

/**
 * Whether a kept GitHub Pages workflow builds in standalone mode. Workflows
 * generated before `experimental.pages` existed lack it, and their artifact
 * then has no root entry point once the flag is on.
 */
export function workflowIsStandalone(workflow: string): boolean {
  return workflow.includes(`${STANDALONE_ENV}:`);
}

/**
 * `pnpm/action-setup` requires an explicit `version` unless `package.json`
 * declares pnpm in `packageManager` or `devEngines.packageManager`; without
 * either, the workflow's first step fails. Pin the major of the pnpm that ran
 * this command when the user agent names it, and fall back to `latest`.
 *
 * @returns the version to pass, or `undefined` when package.json already pins it
 */
export function pnpmSetupVersion(projectRoot: string, userAgent = ""): string | undefined {
  try {
    const pkg = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf-8")) as {
      packageManager?: unknown;
      devEngines?: { packageManager?: unknown };
    };
    if (typeof pkg.packageManager === "string" && pkg.packageManager.startsWith("pnpm@")) {
      return undefined;
    }
    const declared = pkg.devEngines?.packageManager;
    const entries = Array.isArray(declared) ? declared : declared ? [declared] : [];
    if (
      entries.some(
        (entry) =>
          (entry as { name?: unknown })?.name === "pnpm" &&
          typeof (entry as { version?: unknown })?.version === "string"
      )
    ) {
      return undefined;
    }
  } catch {
    // no or unreadable package.json — pin explicitly below
  }
  const major = /\bpnpm\/(\d+)\./.exec(userAgent)?.[1];
  return major ?? "latest";
}

/**
 * GitHub Pages workflow for `flame deploy`, matched to the project's package
 * manager (lockfile first, then the invoking one). Shared by the Bun and the
 * Node/Deno deploy entries so the workflow never depends on which runtime ran
 * the CLI.
 */
export function generateWorkflowYml(
  projectRoot: string = PROJECT_ROOT,
  userAgent: string = process.env.npm_config_user_agent || ""
): string {
  const pm = detectPkgManager(projectRoot, userAgent);
  const hasLockFile = existsSync(join(projectRoot, pm.lockFile));
  const installCmd = getInstallCommand(pm, hasLockFile);
  const pnpmVersion =
    pm.setupAction === "pnpm" ? pnpmSetupVersion(projectRoot, userAgent) : undefined;
  const cacheLine = hasLockFile && pm.cache ? `          cache: ${pm.cache}` : "";

  const setupSteps: string[] = [
    "      - uses: actions/checkout@v7",
    "        with:",
    "          fetch-depth: 0",
    "",
  ];

  if (pm.setupAction === "bun") {
    setupSteps.push(
      "      - uses: oven-sh/setup-bun@v2",
      "        with:",
      "          bun-version: latest",
      ""
    );
  } else if (pm.setupAction === "pnpm") {
    setupSteps.push(
      "      - uses: pnpm/action-setup@v6",
      ...(pnpmVersion ? ["        with:", `          version: "${pnpmVersion}"`] : []),
      "",
      "      - uses: actions/setup-node@v6",
      "        with:",
      "          node-version: 22",
      ...(cacheLine ? [cacheLine] : []),
      ""
    );
  } else {
    // npm / yarn
    setupSteps.push(
      "      - uses: actions/setup-node@v6",
      "        with:",
      "          node-version: 22",
      ...(cacheLine ? [cacheLine] : []),
      ""
    );
  }

  return [
    `name: Deploy to GitHub Pages`,
    "",
    "on:",
    "  push:",
    "    branches: [main]",
    "  workflow_dispatch:",
    "",
    "permissions:",
    "  contents: read",
    "  pages: write",
    "  id-token: write",
    "",
    "concurrency:",
    '  group: "pages"',
    "  cancel-in-progress: false",
    "",
    "jobs:",
    "  build:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    ...setupSteps,
    `      - run: ${installCmd}`,
    "",
    `      - run: ${pm.runCmd} run build`,
    "        env:",
    // The workflow publishes the dist on its own: under `experimental.pages`
    // the build adds a root redirect and 404 (a no-op without the flag).
    `          ${STANDALONE_ENV}: "1"`,
    // GitHub Pages serves files by exact path: canonical URLs carry `.html`.
    `          ${DEPLOY_TARGET_ENV}: github-pages`,
    "",
    "      - name: Add .nojekyll",
    "        run: touch .docu/dist/.nojekyll",
    "",
    "      - uses: actions/upload-pages-artifact@v3",
    "        with:",
    "          path: .docu/dist",
    "",
    "  deploy:",
    "    environment:",
    "      name: github-pages",
    "      url: ${{ steps.deployment.outputs.page_url }}",
    "    runs-on: ubuntu-latest",
    "    needs: build",
    "    steps:",
    "      - id: deployment",
    "        uses: actions/deploy-pages@v4",
  ].join("\n");
}

function generateDockerWorkflowYml(): string {
  const imageName = "ghcr.io/${{ github.repository }}";
  return [
    `name: Build & Push Docker Image`,
    "",
    "on:",
    "  push:",
    "    branches: [main]",
    "  workflow_dispatch:",
    "",
    "permissions:",
    "  contents: read",
    "  packages: write",
    "",
    "jobs:",
    "  build:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - uses: actions/checkout@v4",
    "        with:",
    "          fetch-depth: 0",
    "",
    "      - name: Log in to GHCR",
    "        uses: docker/login-action@v3",
    "        with:",
    "          registry: ghcr.io",
    "          username: ${{ github.actor }}",
    "          password: ${{ secrets.GITHUB_TOKEN }}",
    "",
    "      - name: Build & push",
    "        uses: docker/build-push-action@v5",
    "        with:",
    "          context: .",
    `          tags: ${imageName}:latest`,
    "          push: true",
  ].join("\n");
}

async function writeGhaWorkflow() {
  if (!existsSync(WORKFLOW_FILE)) {
    await mkdir(WORKFLOW_DIR, { recursive: true });
    await writeFile(WORKFLOW_FILE, generateWorkflowYml());
    log.created("📄 Created .github/workflows/deploy.yml");
  } else {
    const kept = readFileSync(WORKFLOW_FILE, "utf-8");
    // Standalone mode only matters with a docs prefix: at a root deployment the
    // docs index already answers `/`.
    for (const warning of keptWorkflowWarnings(kept, needsStandaloneRoot(ownPages(), basePath()))) {
      log.info(warning);
    }
  }
}

const DOCKER_WORKFLOW_FILE = join(WORKFLOW_DIR, "deploy-docker.yml");

async function writeDockerWorkflow() {
  if (!existsSync(DOCKER_WORKFLOW_FILE)) {
    await mkdir(WORKFLOW_DIR, { recursive: true });
    await writeFile(DOCKER_WORKFLOW_FILE, generateDockerWorkflowYml());
    log.created("📄 Created .github/workflows/deploy-docker.yml");
  }
}

export async function runDeploy(): Promise<void> {
  log.info("📦 Building for production...\n");
  await runBuild();

  // Common: .nojekyll + _headers
  await writeFile(join(DIST_DIR, ".nojekyll"), "");
  await writeFile(join(DIST_DIR, "_headers"), buildHeadersFile(bundlePath()));

  if (isDocker) {
    await writeDockerFiles();
    if (isCi) await writeDockerWorkflow();
  } else {
    await writeGhaWorkflow();
  }

  log.ok();
  log.out("   Output: .docu/dist/");
  if (isDocker) {
    log.out("   Build locally: docker build -t my-docs . && docker run -p 80:80 my-docs");
    if (isCi) {
      log.out("   Push to GitHub — CI will build & push Docker image to GHCR");
      log.out("   Then pull latest image on your hosting platform (Coolify, etc.)");
    } else {
      log.out("   For Coolify: connect repo, set build pack to Dockerfile");
    }
  } else {
    log.out("   Push to GitHub and enable Pages (Settings → Pages → Source: GitHub Actions)");
  }
}
