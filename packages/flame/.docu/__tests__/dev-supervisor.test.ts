import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  DEV_RESTART_EXIT_CODE,
  hasWorkspacePackages,
  superviseDev,
} from "../../bin/dev-supervisor.mjs";

let dir: string | undefined;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

/** A child that logs each start and exits with the next code from `codes`. */
function childScript(codes: number[]) {
  dir = mkdtempSync(join(tmpdir(), "flame-supervisor-"));
  const log = join(dir, "starts.log");
  const script = join(dir, "child.mjs");
  writeFileSync(
    script,
    `import { appendFileSync, existsSync, readFileSync } from "node:fs";
const log = ${JSON.stringify(log)};
const run = existsSync(log) ? readFileSync(log, "utf8").split("\\n").filter(Boolean).length : 0;
appendFileSync(log, (process.env.FLAME_DEV_SUPERVISED ?? "unset") + "\\n");
process.exit(${JSON.stringify(codes)}[run] ?? 0);
`
  );
  const starts = () => readFileSync(log, "utf8").split("\n").filter(Boolean);
  return { script, starts };
}

describe("superviseDev", () => {
  it("restarts on the restart exit code and passes the supervised flag", async () => {
    const { script, starts } = childScript([DEV_RESTART_EXIT_CODE, DEV_RESTART_EXIT_CODE, 0]);
    let restarts = 0;
    const code = await superviseDev(process.execPath, [script], {
      onRestart: () => restarts++,
    });
    expect(code).toBe(0);
    expect(restarts).toBe(2);
    expect(starts()).toEqual(["1", "1", "1"]);
  });

  it("finishes with any other exit code without restarting", async () => {
    const { script, starts } = childScript([3]);
    expect(await superviseDev(process.execPath, [script])).toBe(3);
    expect(starts()).toHaveLength(1);
  });

  it("does not restart after a stop signal, even if the child asks to", async () => {
    dir = mkdtempSync(join(tmpdir(), "flame-supervisor-"));
    const ready = join(dir, "ready");
    const script = join(dir, "child.mjs");
    writeFileSync(
      script,
      `import { writeFileSync } from "node:fs";
process.on("SIGTERM", () => process.exit(${DEV_RESTART_EXIT_CODE}));
writeFileSync(${JSON.stringify(ready)}, "1");
setInterval(() => {}, 1000);
`
    );
    const done = superviseDev(process.execPath, [script]);
    for (let i = 0; i < 100; i++) {
      try {
        readFileSync(ready);
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 20));
      }
    }
    process.emit("SIGTERM");
    expect(await done).toBe(DEV_RESTART_EXIT_CODE);
  });
});

describe("hasWorkspacePackages", () => {
  it("is true for flame's sibling packages in this monorepo", () => {
    expect(
      hasWorkspacePackages(pathToFileURL(join(import.meta.dirname, "../../bin/cli.js")).href)
    ).toBe(true);
  });

  it("is false when the packages are installed under node_modules", () => {
    dir = mkdtempSync(join(tmpdir(), "flame-supervisor-"));
    const pkg = join(dir, "node_modules", "@docubook", "markdown");
    mkdirSync(join(pkg, "dist"), { recursive: true });
    writeFileSync(
      join(pkg, "package.json"),
      JSON.stringify({ name: "@docubook/markdown", exports: { ".": "./dist/index.js" } })
    );
    writeFileSync(join(pkg, "dist", "index.js"), "export {};\n");
    const from = pathToFileURL(join(dir, "app.js")).href;
    // Only the package the fixture installs: under `pnpm exec`, NODE_PATH
    // points at this monorepo's store, where the other names would resolve.
    expect(hasWorkspacePackages(from, ["@docubook/markdown"])).toBe(false);
  });
});
