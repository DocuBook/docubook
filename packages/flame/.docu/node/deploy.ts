/**
 * Deploy script — 3 modes:
 *   1. `flame deploy`           → build + generate GitHub Actions workflow
 *   2. `flame deploy --docker`  → build + generate Docker deployment files
 *   3. `flame deploy --docker --silent` → same as #2, minimal output
 *
 * Bun-native path — uses Bun.write() and Bun.spawn().
 */

import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DIST_DIR, PROJECT_ROOT } from "./paths";
import { HEADERS_FILE } from "./deploy.shared";

export { HEADERS_FILE };

const WORKFLOW_DIR = join(PROJECT_ROOT, ".github/workflows");
const WORKFLOW_FILE = join(WORKFLOW_DIR, "deploy.yml");

const isDocker = !!process.env.FLAME_DEPLOY_DOCKER;
const isSilent = !!process.env.FLAME_DEPLOY_SILENT;

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

export const NGINX_CONF = `server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_types text/html text/css application/javascript image/svg+xml;

  # Security headers (server-level, inherited by all locations)
  # HSTS effective when HTTPS is terminated upstream (reverse proxy / LB)
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  }

  location /docs/assets/ {
    expires 7d;
    add_header Cache-Control "public";
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  }

  location / {
    try_files $uri $uri.html $uri/ =404;
  }
}
`;

export const DOCKERFILE_BUN = `FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginx:alpine
COPY --from=builder /app/.docu/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

export const DOCKERIGNORE = `node_modules
.git
*.DS_Store
.docu/dist
.docu/lib
.env
*.log
`;

async function writeDockerFiles() {
  const dockerDir = PROJECT_ROOT;

  if (!existsSync(join(dockerDir, "Dockerfile"))) {
    await Bun.write(join(dockerDir, "Dockerfile"), DOCKERFILE_BUN);
    log.created("📄 Created Dockerfile");
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

async function deploy() {
  log.info("📦 Building for production...\n");
  await runBuild();

  // Common: .nojekyll + _headers
  await Bun.write(join(DIST_DIR, ".nojekyll"), "");
  await Bun.write(join(DIST_DIR, "_headers"), HEADERS_FILE);

  if (isDocker) {
    await writeDockerFiles();
  } else {
    await writeGhaWorkflow();
  }

  log.ok();
  log.out("   Output: .docu/dist/");
  if (isDocker) {
    log.out("   Run: docker build -t my-docs . && docker run -p 80:80 my-docs");
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
      - uses: actions/checkout@v4
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

if (import.meta.main) {
  deploy().catch((err) => {
    console.error("Deploy failed:", err);
    process.exit(1);
  });
}
