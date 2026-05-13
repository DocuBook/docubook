/**
 * Deploy script - prepares .docu/dist for GitHub Pages
 *
 * Usage: bun deploy
 *   Runs build, adds .nojekyll, and generates GitHub Actions workflow.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";

const DIST_DIR = resolve("./.docu/dist");
const WORKFLOW_DIR = resolve("./.github/workflows");
const WORKFLOW_FILE = join(WORKFLOW_DIR, "deploy.yml");

async function deploy() {
  console.log("📦 Building for production...\n");

  // Run build
  const build = Bun.spawn(["bun", "run", "build"], {
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await build.exited;
  if (exitCode !== 0) {
    console.error("\n❌ Build failed");
    process.exit(1);
  }

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

deploy().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
