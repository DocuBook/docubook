#!/usr/bin/env bun
/* global process, console */

import { resolve, join } from "node:path";
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const COMMAND_MAP = {
  dev: "server.ts",
  build: "build.ts",
  clean: "clean.ts",
  preview: "preview.ts",
  deploy: "deploy.ts",
};

const command = process.argv[2];

if (!command || command === "--help" || command === "-h") {
  console.log(`
  @docubook/flame —  A blazing-fast React + MDX framework powered by Bun, built for modern documentation experiences.,

  Usage: flame <command>

  Commands:
    dev       Start development server
    build     Build for production
    clean     Clean build artifacts
    preview   Preview production build
    deploy    Deploy to production
    init      Scaffold a new project in current directory

  Options:
    --help    Show this help message
`);
  process.exit(0);
}

if (command === "init") {
  const scaffoldDir = resolve(import.meta.dirname, "../template");
  const targetDir = process.cwd();

  if (existsSync(join(targetDir, "docu.json"))) {
    console.error("docu.json already exists. Aborting to avoid overwriting.");
    process.exit(1);
  }

  cpSync(scaffoldDir, targetDir, { recursive: true });

  const pkgPath = join(targetDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const flamePkg = JSON.parse(
    readFileSync(resolve(import.meta.dirname, "../package.json"), "utf-8")
  );
  pkg.dependencies["@docubook/flame"] = `^${flamePkg.version}`;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  console.log(`\n  ✓ Project scaffolded!\n\n  Next steps:\n    bun install\n    bun run dev\n`);
  process.exit(0);
}

if (!(command in COMMAND_MAP)) {
  console.error(`Unknown command: "${command}"\nRun "flame --help" for available commands.`);
  process.exit(1);
}

const scriptPath = resolve(import.meta.dirname, "../.docu/lib", COMMAND_MAP[command]);
await import(scriptPath);
