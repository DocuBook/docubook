import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

/**
 * Server-only helpers that touch the filesystem, git, or `node:path`.
 *
 * Kept OUT of `./utils` (which is bundled into the browser): Bun's bundler
 * injects a full `node:path` polyfill into browser builds for any module that
 * imports it, even when the calls are never reached at runtime. Everything in
 * this file is imported exclusively by server-side modules (build, dev server,
 * search indexer) and their tests.
 */

export interface ScannedMdxFile {
  path: string;
  absPath: string;
  mtime: number;
}

/**
 * Scan a directory recursively for MDX/MD files.
 * Skips "assets" directories, hidden directories (dot-prefixed), and root-level
 * index.mdx/index.md (the docs root renders separately in build).
 * Shared between build.ts and search-indexer.ts.
 */
export async function scanMdxFiles(dir: string, baseDir = ""): Promise<ScannedMdxFile[]> {
  const files: ScannedMdxFile[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (entry.name === "assets" || entry.name.startsWith(".")) continue;
      files.push(...(await scanMdxFiles(fullPath, relativePath)));
    } else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
      // Root index renders separately (either extension) — scanning it would
      // produce a duplicate "index" page colliding with dist/docs/index.html.
      if (!baseDir && (entry.name === "index.mdx" || entry.name === "index.md")) continue;
      const stats = await stat(fullPath);
      let path = relativePath.replace(/\.(mdx|md)$/, "");

      if (/\/index$/.test(path)) {
        path = path.replace(/\/index$/, "");
      }
      files.push({ path, absPath: fullPath, mtime: stats.mtimeMs });
    }
  }

  return files;
}

/**
 * Resolve the docs root index source — docs/index.mdx preferred, docs/index.md
 * as fallback (mirrors the dev server's getDocsForSlug extension handling).
 */
export function resolveDocsIndexSource(docsDir: string): string | undefined {
  for (const ext of [".mdx", ".md"]) {
    const candidate = join(docsDir, `index${ext}`);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

/** Get git last modified date for a file */
export async function getGitLastModified(filePath: string): Promise<string | null> {
  try {
    const cleanPath = filePath.replace(/^\//, "");
    if (
      !cleanPath ||
      !/^[a-zA-Z0-9\-_/.\s]+$/.test(cleanPath) ||
      /(^|\/)\.\.($|\/)/.test(cleanPath)
    )
      return null;
    const proc = Bun.spawn(["git", "log", "-1", "--format=%cI", "--", cleanPath], {
      stderr: "ignore",
    });
    const text = await new Response(proc.stdout).text();
    const date = text.trim();
    return date || null;
  } catch (err) {
    console.error("Failed to get git last modified for", filePath, err);
    return null;
  }
}

/** Batch git last modified dates for multiple files in a single spawn */
export async function getGitLastModifiedBatch(filePaths: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (filePaths.length === 0) return result;

  // Filter and validate paths — same guard as getGitLastModified
  const safePaths: string[] = [];
  for (const fp of filePaths) {
    const cleanPath = fp.replace(/^\//, "");
    if (
      !cleanPath ||
      !/^[a-zA-Z0-9\-_/.\s]+$/.test(cleanPath) ||
      /(^|\/)\.\.($|\/)/.test(cleanPath)
    ) {
      console.warn(`[server-utils] getGitLastModifiedBatch: skipping invalid path "${fp}"`);
      continue;
    }
    safePaths.push(cleanPath);
  }

  if (safePaths.length === 0) return result;

  try {
    const proc = Bun.spawn(
      ["git", "log", "--format=%cI", "--name-only", "--diff-filter=ACMR", ...safePaths],
      { stderr: "ignore" }
    );
    const text = await new Response(proc.stdout).text();
    let currentDate = "";

    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
        currentDate = trimmed;
      } else if (currentDate && !result.has(trimmed)) {
        result.set(trimmed, currentDate);
      }
    }
  } catch (err) {
    console.error("Failed to get git last modified batch for", filePaths, err);
  }

  return result;
}

const MIME_TYPES: Record<string, string> = {
  html: "text/html",
  css: "text/css",
  js: "application/javascript",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
};

export function getContentType(pathname: string): string {
  const ext = pathname.split(".").pop()?.toLowerCase();
  return MIME_TYPES[ext || ""] || "application/octet-stream";
}
