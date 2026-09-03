import { resolve, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { readdir, rm, unlink } from "node:fs/promises";
import type { DocuConfig } from "./types";

/**
 * FRAMEWORK_ROOT: Where the package code lives (.docu/components, .docu/pages, .docu/styles, .docu/node)
 * PROJECT_ROOT: Where the user's project lives (docs/, docu.json)
 */

// .docu/node/paths.ts → package root is 2 levels up
export const FRAMEWORK_ROOT = resolve(import.meta.dirname, "../..");

/**
 * Find the project root by walking up from cwd until docu.json is found.
 * Falls back to cwd when not found (tests, ad-hoc scripts). Bun 1.4
 * `run --parallel --filter` may change cwd per workspace task, so a bare
 * process.cwd() can point at the wrong package.
 */
function findProjectRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    try {
      if (existsSync(join(dir, "docu.json"))) return dir;
    } catch {
      break;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}
export const PROJECT_ROOT = findProjectRoot();

// Framework paths (internal)
export const PAGES_DIR = join(FRAMEWORK_ROOT, ".docu/pages");
export const STYLES_DIR = join(FRAMEWORK_ROOT, ".docu/styles");
const nodeDir = join(FRAMEWORK_ROOT, ".docu/node");
const libDir = join(FRAMEWORK_ROOT, ".docu/lib");
export const LIB_DIR = existsSync(nodeDir) ? nodeDir : libDir;

// Build output (user project)
export const DIST_DIR = join(PROJECT_ROOT, ".docu/dist");
export const ASSETS_DIR = join(DIST_DIR, "assets");
export const CACHE_FILE = join(PROJECT_ROOT, ".docu/build-cache.json");

// Project paths (user content)
export const DOCS_DIR = join(PROJECT_ROOT, "docs");
export const DOCS_ASSETS_DIR = join(PROJECT_ROOT, "docs/assets");
export const DOCU_CONFIG_PATH = join(PROJECT_ROOT, "docu.json");

/** Resolve a project-relative file against the discovered PROJECT_ROOT. */
export function resolveProjectFile(...segments: string[]): string {
  return join(PROJECT_ROOT, ...segments);
}

// Config singleton
let _config: DocuConfig | null = null;

/** Clean stale client bundles from a previous build. */
export async function cleanOldBundles(preserve?: Set<string>) {
  try {
    const files = await readdir(ASSETS_DIR);
    for (const file of files) {
      if (preserve?.has(file)) continue;
      if (file.startsWith("client.") || file.startsWith("client-")) {
        await unlink(join(ASSETS_DIR, file));
      }
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Failed to clean old bundles:", (err as Error).message);
    }
  }
  try {
    await rm(join(ASSETS_DIR, "chunks"), { recursive: true, force: true });
  } catch (err) {
    // chunks dir may not exist, or permission error — log to avoid silent failure
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("[flame] Failed to clean chunks dir:", (err as Error).message);
    }
  }
}

export function loadDocuConfig(): DocuConfig {
  if (_config) return _config;
  if (!existsSync(DOCU_CONFIG_PATH)) {
    throw new Error(`docu.json not found at ${DOCU_CONFIG_PATH}`);
  }
  _config = JSON.parse(readFileSync(DOCU_CONFIG_PATH, "utf-8"));
  return _config!;
}
