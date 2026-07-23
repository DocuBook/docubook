#!/usr/bin/env node
/* global process, console, Bun, Deno */

import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { cpSync, existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";

const __dirname = import.meta.dirname;

// Runtime detection — override with FLAME_RUNTIME=bun|node|deno for testing.
// Deno's npm compat layer may expose `Bun` via globals, check execPath first.
const runtime =
  process.env.FLAME_RUNTIME ||
  (process.execPath.includes("deno")
    ? "deno"
    : typeof Bun !== "undefined"
      ? "bun"
      : typeof Deno !== "undefined"
        ? "deno"
        : "node");

const COMMAND_MAP = {
  bun: {
    dev: "server.ts",
    build: "build.ts",
    clean: "clean.ts",
    preview: "preview.ts",
    deploy: "deploy.ts",
  },
  node: {
    dev: "server.node.ts",
    build: "build.node.ts",
    clean: "clean.ts",
    preview: "preview.node.ts",
    deploy: "deploy.node.ts",
  },
  deno: {
    dev: "server.deno.ts",
    build: "build.deno.ts",
    clean: "clean.ts",
    preview: "preview.deno.ts",
    deploy: "deploy.deno.ts",
  },
}[runtime];

if (!COMMAND_MAP) {
  console.error(`Unknown runtime: "${process.env.FLAME_RUNTIME}" (expected bun, node, or deno)`);
  process.exit(1);
}

const command = process.argv[2];

// Parse flags
const themeIndex = process.argv.indexOf("--theme");
if (themeIndex !== -1 && themeIndex + 1 < process.argv.length) {
  process.env.FLAME_THEME = process.argv[themeIndex + 1];
}
const hasDocker = process.argv.includes("--docker");
const hasSilent = process.argv.includes("--silent");
const hasCi = process.argv.includes("--ci");
if (hasDocker) process.env.FLAME_DEPLOY_DOCKER = "1";
if (hasSilent) process.env.FLAME_DEPLOY_SILENT = "1";
if (hasCi) process.env.FLAME_DEPLOY_CI = "1";

// Production mode for build/preview/deploy — ensures minified client bundle
// on all platforms (Coolify, Vercel, etc.) without requiring the user to
// set NODE_ENV manually.
if (
  (command === "build" || command === "preview" || command === "deploy") &&
  !process.env.NODE_ENV
) {
  process.env.NODE_ENV = "production";
}

if (!command || command === "--help" || command === "-h") {
  console.log(`
  @docubook/flame — A blazing-fast React + MDX framework for modern documentation experiences. Runs on Bun, Node.js, and Deno.

  Usage: flame <command>

  Commands:
    dev       Start development server
    build     Build for production
    clean     Clean build artifacts
    preview   Preview production build
    deploy    Deploy to production
    init      Scaffold a new project in current directory

  Options:
    --help        Show this help message
    --theme <name>  Override theme preset (e.g. freshlime, coffee). Works with dev, build, preview.
    --docker      Generate Docker deployment files (Dockerfile + nginx.conf + .dockerignore). Works with deploy.
    --ci          Generate CI workflow (.github/workflows/deploy-docker.yml) for auto build & push to GHCR. Use with --docker.
    --silent      Suppress non-essential output. Works with deploy.
`);
  process.exit(0);
}

if (command === "init") {
  try {
    const scaffoldDir = resolve(__dirname, "../template");
    const targetDir = process.cwd();

    if (!existsSync(scaffoldDir)) {
      console.error("Template directory not found. Package may be corrupted.");
      process.exit(1);
    }

    if (existsSync(join(targetDir, "docu.json"))) {
      console.error("docu.json already exists. Aborting to avoid overwriting.");
      process.exit(1);
    }

    cpSync(scaffoldDir, targetDir, { recursive: true });

    const gitignoreSrc = join(targetDir, "gitignore");
    if (existsSync(gitignoreSrc)) {
      renameSync(gitignoreSrc, join(targetDir, ".gitignore"));
    }

    const pkgPath = join(targetDir, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const flamePkg = JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf-8"));
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["@docubook/flame"] = `^${flamePkg.version}`;
    if (runtime === "deno") {
      // Deno has no node_modules/.bin — tasks must call flame via npm: specifier.
      const flameCmd = "deno run -A npm:@docubook/flame";
      pkg.scripts = {
        dev: `${flameCmd} dev`,
        build: `NODE_ENV=production ${flameCmd} build`,
        preview: `${flameCmd} preview`,
        deploy: `${flameCmd} deploy`,
      };

      // Generate deno.json with nodeModulesDir for npm compat.
      const denoConfig = {
        nodeModulesDir: "auto",
      };
      writeFileSync(join(targetDir, "deno.json"), JSON.stringify(denoConfig, null, 2) + "\n");
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

    // Runtime detection via shebang (#!/usr/bin/env node) makes typeof Bun
    // unavailable — check for bun.lock as a reliable Bun indicator.
    const isBun = existsSync(join(targetDir, "bun.lock"));
    const pkgManager = runtime === "deno" ? "deno" : isBun ? "bun" : "node";
    const nextSteps = {
      bun: "    bun install\n    bun run dev",
      node: "    npm install\n    npm run dev",
      deno: "    deno task dev\n\n  ⚠️  If you see a freshness error, run:\n    DENO_ALLOW_NEWER=true deno task dev",
    }[pkgManager];
    console.log(`\n  ✓ Project scaffolded!\n\n  Next steps:\n${nextSteps}\n`);
    process.exit(0);
  } catch (err) {
    console.error(`Failed to scaffold project: ${err.message}`);
    process.exit(1);
  }
}

if (!(command in COMMAND_MAP)) {
  console.error(`Unknown command: "${command}"\nRun "flame --help" for available commands.`);
  process.exit(1);
}

const sourceFile = COMMAND_MAP[command];
const packageRoot = resolve(__dirname, "..");
const nodePath = join(packageRoot, ".docu/node", sourceFile);
const libPath = join(packageRoot, ".docu/lib", sourceFile.replace(/\.ts$/, ".js"));

// Bun executes TypeScript sources directly; Node and Deno use the
// precompiled JS in .docu/lib, generated at publish. In a monorepo clone
// .docu/lib is gitignored, so compile it lazily — the entry graph imports
// .tsx sources that Node cannot load.
if (runtime !== "bun" && !existsSync(libPath) && existsSync(nodePath)) {
  console.log("flame: .docu/lib missing — precompiling entry points...");
  const compileScript = join(__dirname, "compile-lib.mjs");
  const result = spawnSync(
    process.execPath,
    typeof Deno === "undefined" ? [compileScript] : ["run", "-A", compileScript],
    { cwd: packageRoot, stdio: "inherit" }
  );
  if (result.status !== 0) {
    console.error(
      result.error
        ? `flame: failed to run compile-lib.mjs: ${result.error.message}`
        : "flame: failed to precompile .docu/lib (see output above)."
    );
    process.exit(result.status ?? 1);
  }
}

const scriptPath =
  runtime === "bun"
    ? existsSync(nodePath)
      ? nodePath
      : libPath
    : existsSync(libPath)
      ? libPath
      : nodePath;
await import(pathToFileURL(scriptPath).href);
