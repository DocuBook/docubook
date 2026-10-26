/**
 * Runtime-neutral git helpers — same behavior as the git functions in
 * `utils.ts` (Bun-only, protected) but spawning via `node:child_process`,
 * which works on Bun, Node.js, and Deno. `mdx.ts` imports from here.
 */

import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";

function runGit(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { maxBuffer: 16 * 1024 * 1024 }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

/**
 * True when git has no history to offer rather than having failed: git is not
 * installed (ENOENT) or exits 128 — not a repository, no commits yet, or a
 * repo owned by another user. Common in CI (`.git` excluded from the build
 * context, fresh `git init`), where mtime is the expected fallback.
 */
function isNoHistoryError(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code;
  return code === "ENOENT" || code === 128;
}

/** First line of git's stderr (or the error message) for a one-line log. */
function gitErrorSummary(err: unknown): string {
  const { stderr, message } = (err ?? {}) as { stderr?: unknown; message?: unknown };
  const text = (typeof stderr === "string" && stderr.trim()) || String(message ?? err);
  return text.split("\n")[0].trim();
}

// Set by the last batch lookup when git had no history, so the per-page
// fallback in compileMdx skips spawning one doomed `git log` per page.
let historyUnavailable = false;

function sanitizePath(filePath: string): string | null {
  const cleanPath = filePath.replace(/^\//, "");
  if (!cleanPath || !/^[a-zA-Z0-9\-_/.\s]+$/.test(cleanPath) || /(^|\/)\.\.($|\/)/.test(cleanPath))
    return null;
  return cleanPath;
}

/** Get git last modified date for a file */
export async function getGitLastModified(filePath: string): Promise<string | null> {
  const cleanPath = sanitizePath(filePath);
  if (!cleanPath || historyUnavailable) return null;
  try {
    const text = await runGit(["log", "-1", "--format=%cI", "--", cleanPath]);
    const date = text.trim();
    return date || null;
  } catch {
    return null;
  }
}

/**
 * Fallback to filesystem mtime when git is unavailable (shallow clone, no .git, etc.).
 * Returns ISO 8601 date string or null.
 */
export async function getFilesystemMtime(filePath: string): Promise<string | null> {
  try {
    const stats = await stat(filePath);
    return stats.mtime.toISOString();
  } catch {
    return null;
  }
}

/** Batch git last modified dates for multiple files in a single spawn */
export async function getGitLastModifiedBatch(filePaths: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  historyUnavailable = false;
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
    if (isNoHistoryError(err)) historyUnavailable = true;
    else
      console.warn(
        `[git] last-modified lookup failed, falling back to file mtime: ${gitErrorSummary(err)}`
      );
  }

  return result;
}
