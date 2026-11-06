/**
 * Writing the cards in `onEnd`. The output directory is the cache: a manifest
 * records the render hash of every file on disk, so a build renders only the
 * cards whose inputs changed and writes nothing when none did.
 */

import { mkdir, readFile, rename, rmdir, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { PlannedCard } from "./cards";
import { pngSize } from "./renderer";
import { HEIGHT, WIDTH } from "./layouts";
import { isInside } from "./site";

export const MANIFEST_VERSION = 1;

/** WhatsApp drops previews above roughly this size. */
export const SIZE_WARNING_BYTES = 300 * 1024;

/** In-flight renders. A third one bought nothing on a 4-vCPU machine. */
export const RENDER_CONCURRENCY = 2;

export interface Manifest {
  version: number;
  /** Card file below `assets/og/` → render hash of the bytes on disk. */
  files: Record<string, string>;
}

export interface PublishJob extends PlannedCard {
  /** Name hash plus everything else that changes the pixels. */
  renderHash: string;
}

export interface PublishResult {
  rendered: string[];
  unchanged: string[];
  removed: string[];
  oversized: Array<{ file: string; bytes: number }>;
}

export async function readManifest(path: string): Promise<Manifest> {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as Manifest;
    if (parsed?.version === MANIFEST_VERSION && typeof parsed.files === "object" && parsed.files) {
      return parsed;
    }
  } catch {
    // missing or unreadable: start over
  }
  return { version: MANIFEST_VERSION, files: {} };
}

/** Write through a temp file so an interrupted build never leaves half a file. */
export async function writeAtomic(path: string, data: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  try {
    await writeFile(temp, data);
    await rename(temp, path);
  } catch (err) {
    await unlink(temp).catch(() => {});
    throw err;
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

/** Remove now-empty parent directories of a removed card, up to `stop`. */
async function removeEmptyParents(file: string, stop: string): Promise<void> {
  for (let dir = dirname(file); dir.startsWith(stop) && dir !== stop; dir = dirname(dir)) {
    try {
      await rmdir(dir);
    } catch {
      return;
    }
  }
}

/**
 * Bring `cardDir` in line with `jobs`: render cards that are missing or out
 * of date, delete files an earlier build wrote and this one no longer needs,
 * and save the manifest. Only files listed in the previous manifest are ever
 * deleted, so anything else in the directory is left alone.
 */
export async function publishCards(
  jobs: PublishJob[],
  cardDir: string,
  manifestPath: string,
  render: (job: PublishJob) => Promise<Uint8Array>
): Promise<PublishResult> {
  const previous = await readManifest(manifestPath);
  const next: Manifest = { version: MANIFEST_VERSION, files: {} };
  const result: PublishResult = { rendered: [], unchanged: [], removed: [], oversized: [] };

  const pending: PublishJob[] = [];
  for (const job of jobs) {
    next.files[job.file] = job.renderHash;
    if (previous.files[job.file] === job.renderHash && (await exists(join(cardDir, job.file)))) {
      result.unchanged.push(job.file);
    } else {
      pending.push(job);
    }
  }

  await mapLimit(pending, RENDER_CONCURRENCY, async (job) => {
    const png = await render(job);
    const size = pngSize(png);
    if (!size || size.width !== WIDTH || size.height !== HEIGHT) {
      throw new Error(
        `card for "${job.file}" is ${size ? `${size.width}×${size.height}` : "not a PNG"}, expected ${WIDTH}×${HEIGHT}`
      );
    }
    if (png.byteLength > SIZE_WARNING_BYTES) {
      result.oversized.push({ file: job.file, bytes: png.byteLength });
    }
    await writeAtomic(join(cardDir, job.file), png);
    result.rendered.push(job.file);
  });

  for (const file of Object.keys(previous.files)) {
    if (file in next.files) continue;
    const path = join(cardDir, file);
    // The manifest is a plain file in `.docu/`; never follow it out of `cardDir`.
    if (!isInside(cardDir, path) || path === cardDir) continue;
    try {
      await unlink(path);
      result.removed.push(file);
      await removeEmptyParents(path, cardDir);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }

  await writeAtomic(manifestPath, `${JSON.stringify(next, null, 2)}\n`);
  return result;
}
