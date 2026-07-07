#!/usr/bin/env node
/* global process, console, Bun, Deno */

import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { cpSync, existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";

const __dirname = import.meta.dirname;

// Runtime detection — override with FLAME_RUNTIME=bun|node|deno for testing.
const runtime =
  process.env.FLAME_RUNTIME ||
  (typeof Bun !== "undefined" ? "bun" : typeof Deno !== "undefined" ? "deno" : "node");

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

// Parse --theme flag: set env before importing build script
const themeIndex = process.argv.indexOf("--theme");
if (themeIndex !== -1 && themeIndex + 1 < process.argv.length) {
  process.env.FLAME_THEME = process.argv[themeIndex + 1];
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
        build: `${flameCmd} build`,
        preview: `${flameCmd} preview`,
        deploy: `${flameCmd} deploy`,
      };
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

    const nextSteps = {
      bun: "    bun install\n    bun run dev",
      node: "    npm install\n    npm run dev",
      deno: "    deno task dev",
    }[runtime];
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
const nodePath = resolve(__dirname, "../.docu/node", sourceFile);
const libPath = resolve(__dirname, "../.docu/lib", sourceFile.replace(/\.ts$/, ".js"));
// Bun executes TypeScript sources directly; Node and Deno use the
// precompiled JS in .docu/lib (generated at publish), falling back to the
// TS sources for monorepo development.
const scriptPath =
  runtime === "bun"
    ? existsSync(nodePath)
      ? nodePath
      : libPath
    : existsSync(libPath)
      ? libPath
      : nodePath;
await import(pathToFileURL(scriptPath).href);
