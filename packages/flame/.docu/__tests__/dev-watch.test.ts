import { mkdirSync, mkdtempSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  DEV_RESTART_EXIT_CODE,
  DEV_SUPERVISED_ENV,
  WATCHED_PACKAGES,
  packageFingerprint,
  resolvePackages,
  resolveWorkspacePackages,
  watchWorkspacePackages,
  type WorkspacePackage,
} from "../node/dev-watch";
import * as supervisor from "../../bin/dev-supervisor.mjs";

let root: string | undefined;

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = undefined;
});

/** A package `@test/<name>` with `dist/index.js`, plus a file to resolve from. */
function fixture(layout: "workspace" | "installed") {
  root = mkdtempSync(join(tmpdir(), "flame-dev-watch-"));
  const name = "@test/pkg";
  const pkgDir =
    layout === "workspace"
      ? join(root, "packages", "pkg")
      : join(root, "app", "node_modules", "@test", "pkg");
  mkdirSync(join(pkgDir, "dist"), { recursive: true });
  writeFileSync(
    join(pkgDir, "package.json"),
    JSON.stringify({ name, main: "./dist/index.js", exports: { ".": "./dist/index.js" } })
  );
  writeFileSync(join(pkgDir, "dist", "index.js"), "export const v = 1;\n");
  if (layout === "workspace") {
    // pnpm-style link: node_modules/@test/pkg -> ../../../packages/pkg
    mkdirSync(join(root, "app", "node_modules", "@test"), { recursive: true });
    symlinkSync(pkgDir, join(root, "app", "node_modules", "@test", "pkg"), "dir");
  }
  const from = pathToFileURL(join(root, "app", "index.js")).href;
  return { name, pkgDir, from };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("resolveWorkspacePackages", () => {
  it("finds workspace-linked packages without needing package.json in exports", () => {
    const { name, pkgDir, from } = fixture("workspace");
    const [pkg] = resolveWorkspacePackages([name], from);
    expect(pkg?.name).toBe(name);
    expect(pkg?.dir).toBe(pkgDir);
    expect(pkg?.entry).toBe(join(pkgDir, "dist", "index.js"));
  });

  it("skips copies installed under node_modules", () => {
    const { name, from } = fixture("installed");
    expect(resolveWorkspacePackages([name], from)).toEqual([]);
  });

  it("skips packages that do not resolve", () => {
    const { from } = fixture("workspace");
    expect(resolveWorkspacePackages(["@test/missing"], from)).toEqual([]);
  });

  it("resolves flame's sibling packages in this monorepo", () => {
    const names = resolveWorkspacePackages().map((pkg) => pkg.name);
    expect(names.sort()).toEqual([...WATCHED_PACKAGES].sort());
  });
});

describe("resolvePackages", () => {
  it("keeps copies installed under node_modules", () => {
    const { name, pkgDir, from } = fixture("installed");
    const [pkg] = resolvePackages([name], from);
    expect(pkg?.dir).toBe(pkgDir);
    expect(pkg?.entry).toBe(join(pkgDir, "dist", "index.js"));
  });

  it("finds workspace-linked packages and skips names that do not resolve", () => {
    const { name, pkgDir, from } = fixture("workspace");
    expect(resolvePackages([name, "@test/missing"], from).map((pkg) => pkg.dir)).toEqual([pkgDir]);
  });
});

describe("packageFingerprint", () => {
  it("changes with content, not with identical rewrites, and is null mid-rebuild", () => {
    const { name, from, pkgDir } = fixture("workspace");
    const [pkg] = resolveWorkspacePackages([name], from) as [WorkspacePackage];
    const first = packageFingerprint(pkg);
    writeFileSync(join(pkgDir, "dist", "index.js"), "export const v = 1;\n");
    expect(packageFingerprint(pkg)).toBe(first);
    writeFileSync(join(pkgDir, "dist", "index.js"), "export const v = 2;\n");
    expect(packageFingerprint(pkg)).not.toBe(first);
    unlinkSync(join(pkgDir, "dist", "index.js"));
    expect(packageFingerprint(pkg)).toBeNull();
  });

  it("covers a root styles.css", () => {
    const { name, from, pkgDir } = fixture("workspace");
    const [pkg] = resolveWorkspacePackages([name], from) as [WorkspacePackage];
    const before = packageFingerprint(pkg);
    writeFileSync(join(pkgDir, "styles.css"), ".a{}\n");
    expect(packageFingerprint(pkg)).not.toBe(before);
  });
});

describe("watchWorkspacePackages", () => {
  it("reports one change per real rebuild and ignores identical or half-written output", async () => {
    const { name, from, pkgDir } = fixture("workspace");
    const packages = resolveWorkspacePackages([name], from);
    const changes: string[] = [];
    const stop = watchWorkspacePackages(packages, (pkg) => changes.push(pkg.name), {
      debounceMs: 60,
    });
    try {
      const entry = join(pkgDir, "dist", "index.js");

      writeFileSync(entry, "export const v = 1;\n"); // identical rebuild
      await sleep(250);
      expect(changes).toEqual([]);

      unlinkSync(entry); // rebuild in progress: entry gone for a moment
      await sleep(150);
      writeFileSync(entry, "export const v = 2;\n");
      writeFileSync(join(pkgDir, "dist", "chunk.js"), "export {};\n");
      await sleep(300);
      expect(changes).toEqual([name]);

      writeFileSync(join(pkgDir, "styles.css"), ".b{}\n");
      await sleep(300);
      expect(changes).toEqual([name, name]);
    } finally {
      stop();
    }
  });
});

describe("watchWorkspacePackages after dist/ is recreated", () => {
  // `build`/`clean` scripts run `rm -rf dist`: the watcher must follow the new
  // directory, or later rebuilds go unnoticed.
  it("keeps reporting changes after a full rebuild recreates dist/", async () => {
    const { name, from, pkgDir } = fixture("workspace");
    const packages = resolveWorkspacePackages([name], from);
    const changes: string[] = [];
    const stop = watchWorkspacePackages(packages, (pkg) => changes.push(pkg.name), {
      debounceMs: 60,
    });
    try {
      const dist = join(pkgDir, "dist");
      rmSync(dist, { recursive: true, force: true });
      await sleep(150);
      mkdirSync(dist);
      writeFileSync(join(dist, "index.js"), "export const v = 1;\n"); // identical output
      await sleep(300);
      expect(changes).toEqual([]);

      writeFileSync(join(dist, "index.js"), "export const v = 2;\n");
      await sleep(300);
      expect(changes).toEqual([name]);
    } finally {
      stop();
    }
  });
});

describe("dev supervisor contract", () => {
  it("shares the restart exit code, env flag and package list with bin/dev-supervisor.mjs", () => {
    expect(supervisor.DEV_RESTART_EXIT_CODE).toBe(DEV_RESTART_EXIT_CODE);
    expect(supervisor.DEV_SUPERVISED_ENV).toBe(DEV_SUPERVISED_ENV);
    expect(supervisor.WATCHED_PACKAGES).toEqual([...WATCHED_PACKAGES]);
  });
});
