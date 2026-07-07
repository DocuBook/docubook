/**
 * Runtime-neutral deploy — mirror of `deploy.ts` (Bun-only, protected) for
 * Node.js and Deno. Instead of spawning `bun run build`, it runs the neutral
 * build in-process, then prepares `.docu/dist` for GitHub Pages.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DIST_DIR, PROJECT_ROOT } from "./paths";

const WORKFLOW_DIR = join(PROJECT_ROOT, ".github/workflows");
const WORKFLOW_FILE = join(WORKFLOW_DIR, "deploy.yml");

export async function runDeploy(): Promise<void> {
  console.log("📦 Building for production...\n");

  process.env.NODE_ENV = "production";
  const { runBuildCli } = await import("./build.impl");
  await runBuildCli();

  // Add .nojekyll
  await writeFile(join(DIST_DIR, ".nojekyll"), "");

  // Generate GitHub Actions workflow
  if (!existsSync(WORKFLOW_FILE)) {
    await mkdir(WORKFLOW_DIR, { recursive: true });
    await writeFile(WORKFLOW_FILE, GITHUB_ACTIONS_WORKFLOW);
    console.log("\n📄 Created .github/workflows/deploy.yml");
  }

  console.log("\n✅ Ready to deploy!");
  console.log("   Output: .docu/dist/");
  console.log("   Push to GitHub and enable Pages (Settings → Pages → Source: GitHub Actions)");
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

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm install

      - run: npm run build

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
