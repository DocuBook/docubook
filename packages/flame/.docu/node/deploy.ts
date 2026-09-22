/**
 * Deploy script — 3 modes:
 *   1. `flame deploy`           → build + generate GitHub Actions workflow
 *   2. `flame deploy --docker`  → build + generate Docker deployment files
 *   3. `flame deploy --docker --silent` → same as #2, minimal output
 *
 * Bun-native path — uses Bun.write() and Bun.spawn().
 */

import { mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DIST_DIR, PROJECT_ROOT } from "./paths";
import {
  DOCKERFILE_BUN,
  DOCKERFILE_MARKER,
  generateDockerfile,
  HEADERS_FILE,
  NGINX_CONF,
  DOCKERIGNORE,
} from "./deploy.shared";

export { HEADERS_FILE, NGINX_CONF, DOCKERIGNORE, DOCKERFILE_BUN };

const WORKFLOW_DIR = join(PROJECT_ROOT, ".github/workflows");
const WORKFLOW_FILE = join(WORKFLOW_DIR, "deploy.yml");
const DOCKER_WORKFLOW_FILE = join(WORKFLOW_DIR, "deploy-docker.yml");

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
  const build = Bun.spawn(["bun", "run", "build"], {
    stdout: isSilent ? "ignore" : "inherit",
    stderr: isSilent ? "ignore" : "inherit",
  });
  const exitCode = await build.exited;
  if (exitCode !== 0) {
    console.error("\n❌ Build failed");
    process.exit(1);
  }
}

async function writeDockerFiles() {
  const dockerDir = PROJECT_ROOT;

  const dockerfilePath = join(dockerDir, "Dockerfile");
  if (!existsSync(dockerfilePath)) {
    await Bun.write(dockerfilePath, generateDockerfile(dockerDir));
    log.created("📄 Created Dockerfile");
  } else if (readFileSync(dockerfilePath, "utf-8").startsWith(`${DOCKERFILE_MARKER}\n`)) {
    await Bun.write(dockerfilePath, generateDockerfile(dockerDir));
    log.created("📄 Updated generated Dockerfile");
  } else {
    log.info(
      "⚠️  Dockerfile already exists; skipped it. Delete it and rerun flame deploy --docker to regenerate."
    );
  }

  if (!existsSync(join(dockerDir, "nginx.conf"))) {
    await Bun.write(join(dockerDir, "nginx.conf"), NGINX_CONF);
    log.created("📄 Created nginx.conf");
  }

  if (!existsSync(join(dockerDir, ".dockerignore"))) {
    await Bun.write(join(dockerDir, ".dockerignore"), DOCKERIGNORE);
    log.created("📄 Created .dockerignore");
  }
}

async function writeGhaWorkflow() {
  if (!existsSync(WORKFLOW_FILE)) {
    await mkdir(WORKFLOW_DIR, { recursive: true });
    await Bun.write(WORKFLOW_FILE, GITHUB_ACTIONS_WORKFLOW);
    log.created("📄 Created .github/workflows/deploy.yml");
  }
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

async function writeDockerWorkflow() {
  if (!existsSync(DOCKER_WORKFLOW_FILE)) {
    await mkdir(WORKFLOW_DIR, { recursive: true });
    await Bun.write(DOCKER_WORKFLOW_FILE, generateDockerWorkflowYml());
    log.created("📄 Created .github/workflows/deploy-docker.yml");
  }
}

async function deploy() {
  log.info("📦 Building for production...\n");
  await runBuild();

  // Common: .nojekyll + _headers
  await Bun.write(join(DIST_DIR, ".nojekyll"), "");
  await Bun.write(join(DIST_DIR, "_headers"), HEADERS_FILE);

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

const GITHUB_ACTIONS_WORKFLOW = `name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install

      - run: bun run build

      - name: Add .nojekyll
        run: touch .docu/dist/.nojekyll

      - uses: actions/upload-pages-artifact@v3
        with:
          path: .docu/dist

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
`;

// The CLI dynamically imports this entry point, so import.meta.main is false
// when running `flame deploy` under Bun. The CLI sets FLAME_CLI_ENTRY before
// importing; direct `bun deploy.ts` still uses Bun's main-module detection.
if (import.meta.main || process.env.FLAME_CLI_ENTRY === "1") {
  deploy().catch((err) => {
    console.error("Deploy failed:", err);
    process.exit(1);
  });
}
