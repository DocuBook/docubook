/**
 * Dev server: restart when a workspace-linked @docubook package is rebuilt.
 *
 * Flame imports its sibling packages from their built `dist/` — the client
 * bundle *and* the server renderer, which keeps the modules it loaded for the
 * life of the process. Rebuilding only the client bundle after a package
 * changes would leave SSR on the old code, so the dev server asks to be
 * restarted instead (`bin/dev-supervisor.mjs` respawns it). Packages installed
 * under `node_modules` never change and are not watched, so ordinary projects
 * are unaffected.
 *
 * Server-only (Node built-ins); never import from client code.
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  realpathSync,
  watch,
  type FSWatcher,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, sep } from "node:path";

/** Exit code a supervised dev server uses to ask for a restart (EX_TEMPFAIL). */
export const DEV_RESTART_EXIT_CODE = 75;

/** Set by the supervisor on the dev server it spawns. */
export const DEV_SUPERVISED_ENV = "FLAME_DEV_SUPERVISED";

/** Sibling packages flame renders with, on both the server and the client. */
export const WATCHED_PACKAGES = [
  "@docubook/core",
  "@docubook/markdown",
  "@docubook/ui-react",
  "@docubook/themes-colors",
] as const;

export interface WorkspacePackage {
  name: string;
  /** Package root (realpath). */
  dir: string;
  /** Resolved main entry (realpath); missing while the package rebuilds. */
  entry: string;
}

function findPackageRoot(file: string, name: string): string | null {
  let dir = dirname(file);
  for (;;) {
    const manifest = join(dir, "package.json");
    if (existsSync(manifest)) {
      try {
        if (JSON.parse(readFileSync(manifest, "utf-8")).name === name) return dir;
      } catch {
        // unreadable manifest — keep walking up
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Resolve `names` to the copies flame loads, workspace-linked or installed
 * under `node_modules`. Names that do not resolve are skipped.
 */
export function resolvePackages(
  names: readonly string[] = WATCHED_PACKAGES,
  fromUrl: string = import.meta.url
): WorkspacePackage[] {
  const require = createRequire(fromUrl);
  const packages: WorkspacePackage[] = [];
  for (const name of names) {
    let entry: string;
    try {
      // The main entry, not `<name>/package.json`: package `exports` maps do
      // not have to expose the manifest.
      entry = realpathSync(require.resolve(name));
    } catch {
      continue;
    }
    const dir = findPackageRoot(entry, name);
    if (dir) packages.push({ name, dir, entry });
  }
  return packages;
}

/**
 * Resolve `names` to workspace-linked packages. Installed copies (anything
 * under `node_modules` once symlinks are resolved) are skipped.
 */
export function resolveWorkspacePackages(
  names: readonly string[] = WATCHED_PACKAGES,
  fromUrl: string = import.meta.url
): WorkspacePackage[] {
  return resolvePackages(names, fromUrl).filter(
    (pkg) => !pkg.entry.split(sep).includes("node_modules")
  );
}

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(full));
    else files.push(full);
  }
  return files;
}

/**
 * Content hash of what flame loads from the package: built JS/CSS in `dist/`
 * plus a root `styles.css`. Null while the package is mid-rebuild (entry
 * missing), so a half-written `dist/` never triggers a restart.
 */
export function packageFingerprint(pkg: WorkspacePackage): string | null {
  if (!existsSync(pkg.entry)) return null;
  const files = listFiles(join(pkg.dir, "dist")).filter((file) => /\.(m?js|css)$/.test(file));
  const styles = join(pkg.dir, "styles.css");
  if (existsSync(styles)) files.push(styles);
  const hash = createHash("sha256");
  for (const file of files.sort()) {
    hash.update(relative(pkg.dir, file));
    hash.update("\0");
    try {
      hash.update(readFileSync(file));
    } catch {
      return null; // removed between listing and reading — still rebuilding
    }
  }
  return hash.digest("hex");
}

export interface WatchOptions {
  /** Quiet period after the last file event before comparing. */
  debounceMs?: number;
}

/**
 * Call `onChange` once per real content change of a watched package — not for
 * rebuilds that write identical output, and not while `dist/` is half written.
 * Returns a function that stops watching.
 */
export function watchWorkspacePackages(
  packages: readonly WorkspacePackage[],
  onChange: (pkg: WorkspacePackage) => void,
  { debounceMs = 400 }: WatchOptions = {}
): () => void {
  const watchers = new Set<FSWatcher>();
  const timers = new Set<ReturnType<typeof setTimeout>>();

  for (const pkg of packages) {
    let last = packageFingerprint(pkg);
    let timer: ReturnType<typeof setTimeout> | null = null;

    const check = () => {
      if (timer) timers.delete(timer);
      timer = null;
      const current = packageFingerprint(pkg);
      if (current === null) {
        schedule(); // mid-rebuild: look again once it settles
        return;
      }
      if (current === last) return;
      last = current;
      onChange(pkg);
    };
    const schedule = () => {
      if (timer) {
        clearTimeout(timer);
        timers.delete(timer);
      }
      timer = setTimeout(check, debounceMs);
      timers.add(timer);
    };

    // A recursive watch is bound to the `dist/` directory it was opened on.
    // Vite keeps that directory across watch rebuilds, but `build`/`clean`
    // scripts `rm -rf dist`, after which the old watcher goes silent. The
    // package root (non-recursive) sees `dist` being removed or created, and
    // `styles.css`, so re-attach the `dist/` watcher whenever it changes.
    const dist = join(pkg.dir, "dist");
    let distWatcher: FSWatcher | null = null;
    const attachDist = () => {
      if (distWatcher) {
        distWatcher.close();
        watchers.delete(distWatcher);
        distWatcher = null;
      }
      if (!existsSync(dist)) return;
      try {
        distWatcher = watch(dist, { recursive: true }, schedule);
      } catch {
        return; // removed again before we could watch it; the root sees it
      }
      // A removed directory can surface as a watcher error on some platforms.
      distWatcher.on("error", attachDist);
      watchers.add(distWatcher);
    };
    attachDist();

    const rootWatcher = watch(pkg.dir, (_event, filename) => {
      if (filename === "dist") attachDist();
      if (filename === "dist" || filename === "styles.css") schedule();
    });
    rootWatcher.on("error", () => rootWatcher.close());
    watchers.add(rootWatcher);
  }

  return () => {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    for (const watcher of watchers) watcher.close();
    watchers.clear();
  };
}
