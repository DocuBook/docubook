/**
 * Runtime-neutral git helpers — same behavior as the git functions in
 * `utils.ts` (Bun-only, protected) but spawning via `node:child_process`,
 * which works on Bun, Node.js, and Deno. `mdx.ts` imports from here.
 */

import { execFile } from "node:child_process";

function runGit(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { maxBuffer: 16 * 1024 * 1024 }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

function sanitizePath(filePath: string): string | null {
  const cleanPath = filePath.replace(/^\//, "");
  if (!cleanPath || !/^[a-zA-Z0-9\-_/.\s]+$/.test(cleanPath) || /(^|\/)\.\.($|\/)/.test(cleanPath))
    return null;
  return cleanPath;
}

/** Get git last modified date for a file */
export async function getGitLastModified(filePath: string): Promise<string | null> {
  const cleanPath = sanitizePath(filePath);
  if (!cleanPath) return null;
  try {
    const text = await runGit(["log", "-1", "--format=%cI", "--", cleanPath]);
    const date = text.trim();
    return date || null;
  } catch {
    return null;
  }
}

/** Batch git last modified dates for multiple files in a single spawn */
export async function getGitLastModifiedBatch(filePaths: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (filePaths.length === 0) return result;

  const safePaths: string[] = [];
  for (const fp of filePaths) {
    const cleanPath = sanitizePath(fp);
    if (!cleanPath) {
      console.warn(`[git] getGitLastModifiedBatch: skipping invalid path "${fp}"`);
      continue;
    }
    safePaths.push(cleanPath);
  }

  if (safePaths.length === 0) return result;

  try {
    const text = await runGit([
      "log",
      "--format=%cI",
      "--name-only",
      "--diff-filter=ACMR",
      ...safePaths,
    ]);
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
