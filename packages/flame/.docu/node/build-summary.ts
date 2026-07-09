/**
 * Build output summary: walks `dist` after a build, collects generated files
 * and their sizes, groups them by extension, and formats a scannable report
 * for CI logs. Runtime-neutral — uses only `node:fs/promises` and `node:path`
 * so it runs identically under Bun, Node, and Deno.
 */

import { readdir, stat } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import { existsSync } from "node:fs";

export interface BuildOutputFile {
  path: string;
  size: number;
}

export interface BuildOutputType {
  ext: string;
  count: number;
  size: number;
}

export interface BuildOutput {
  files: BuildOutputFile[];
  byType: BuildOutputType[];
  totalFiles: number;
  totalSize: number;
}

const MAX_FILES_SHOWN = 10;
const SEP = "─".repeat(60);

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function walkFiles(dir: string): Promise<BuildOutputFile[]> {
  const out: BuildOutputFile[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkFiles(full)));
    } else if (entry.isFile()) {
      const s = await stat(full);
      out.push({ path: full, size: s.size });
    }
  }
  return out;
}

/** Collect build output metadata for `distDir`. Returns `null` if the dir is missing or empty. */
export async function collectBuildOutput(distDir: string): Promise<BuildOutput | null> {
  if (!existsSync(distDir)) return null;
  const all = await walkFiles(distDir);
  if (all.length === 0) return null;

  const files = all
    .map((f) => ({ path: relative(distDir, f.path), size: f.size }))
    .sort((a, b) => (b.size !== a.size ? b.size - a.size : a.path.localeCompare(b.path)));

  const byExt = new Map<string, BuildOutputType>();
  for (const f of files) {
    const ext = extname(f.path) || "(none)";
    const entry = byExt.get(ext) ?? { ext, count: 0, size: 0 };
    entry.count++;
    entry.size += f.size;
    byExt.set(ext, entry);
  }
  const byType = [...byExt.values()].sort((a, b) =>
    b.size !== a.size ? b.size - a.size : b.count - a.count
  );

  return {
    files,
    byType,
    totalFiles: files.length,
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
  };
}

/** Format `output` as a human-readable, color-free summary suitable for CI logs. */
export function formatBuildSummary(output: BuildOutput): string {
  const lines: string[] = [];
  lines.push("📦 Build Output Summary:");
  lines.push(SEP);

  const shown = output.files.slice(0, MAX_FILES_SHOWN);
  const nameWidth = Math.min(Math.max(...shown.map((f) => f.path.length), 1), 50);
  for (const f of shown) {
    lines.push(`  ${f.path.padEnd(nameWidth)}  ${formatSize(f.size).padStart(10)}`);
  }
  const remaining = output.totalFiles - shown.length;
  if (remaining > 0) {
    lines.push(`  ... and ${remaining} more file${remaining === 1 ? "" : "s"}`);
  }

  lines.push(SEP);
  lines.push("📊 Summary by Type:");
  const extWidth = Math.max(...output.byType.map((t) => t.ext.length), 1);
  for (const t of output.byType) {
    const plural = t.count === 1 ? "file" : "files";
    lines.push(
      `  ${t.ext.padEnd(extWidth)}   ${String(t.count).padStart(3)} ${plural}   ${formatSize(
        t.size
      ).padStart(10)}`
    );
  }

  lines.push(SEP);
  const totalPlural = output.totalFiles === 1 ? "file" : "files";
  lines.push(
    `📈 Total: ${output.totalFiles} ${totalPlural}   ${formatSize(output.totalSize).padStart(10)}`
  );
  lines.push(SEP);

  return lines.join("\n");
}

/** Collect and format the build summary for `distDir`. Returns `null` when there is nothing to report. */
export async function generateBuildSummary(distDir: string): Promise<string | null> {
  const output = await collectBuildOutput(distDir);
  return output ? formatBuildSummary(output) : null;
}
