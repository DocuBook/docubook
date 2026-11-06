import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cli = join(import.meta.dirname, "../../bin/cli.js");

function runCli(command: string, env: NodeJS.ProcessEnv) {
  const dir = mkdtempSync(join(tmpdir(), "flame-cli-"));
  try {
    const bun = join(dir, "bun");
    writeFileSync(bun, '#!/bin/sh\nprintf "NODE_ENV=%s\\n" "$NODE_ENV"\n');
    chmodSync(bun, 0o755);
    const result = spawnSync(process.execPath, [cli, command], {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, ...env, FLAME_RUNTIME: "bun", PATH: dir },
    });
    return result;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("CLI runtime selection", () => {
  it.each(["build", "preview", "deploy"])("sets production before %s re-exec", (command) => {
    const result = runCli(command, { NODE_ENV: "" });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("NODE_ENV=production");
  });

  it("preserves an explicit NODE_ENV", () => {
    const result = runCli("build", { NODE_ENV: "test" });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("NODE_ENV=test");
  });

  it("does not default dev to production", () => {
    const result = runCli("dev", { NODE_ENV: "" });
    expect(result.stdout).toContain("NODE_ENV=");
    expect(result.stdout).not.toContain("NODE_ENV=production");
  });

  it("does not treat inherited FLAME_REEXEC as proof that Node is Bun", () => {
    const result = runCli("build", { NODE_ENV: "production", FLAME_REEXEC: "1" });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("NODE_ENV=production");
  });
});

// Each test spawns the CLI up to twice; spawnSync kills it after SPAWN_TIMEOUT,
// so the vitest timeout must outlast that worst case or it fires first under load.
const SPAWN_TIMEOUT = 60_000;

describe("deploy flags", { timeout: 2 * SPAWN_TIMEOUT + 10_000 }, () => {
  // Runs the CLI on Node in an empty directory: the warning is printed while
  // flags are parsed, before the deploy itself (which then fails for lack of a
  // docu.json, which is irrelevant here).
  function runDeploy(args: string[]) {
    const dir = mkdtempSync(join(tmpdir(), "flame-cli-flags-"));
    try {
      return spawnSync(process.execPath, [cli, ...args], {
        cwd: dir,
        encoding: "utf8",
        env: { ...process.env, FLAME_RUNTIME: "node", NODE_ENV: "production" },
        timeout: SPAWN_TIMEOUT,
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  const warning = "--ci only applies together with --docker";

  it("warns once when --ci is used without --docker", () => {
    const result = runDeploy(["deploy", "--ci"]);
    expect(result.stderr.split(warning).length - 1).toBe(1);
    expect(result.stderr).toContain("flame deploy --docker --ci");
  });

  it("still warns with --silent, since a flag is being ignored", () => {
    expect(runDeploy(["deploy", "--ci", "--silent"]).stderr).toContain(warning);
  });

  it("does not warn when --ci comes with --docker, or for other commands", () => {
    expect(runDeploy(["deploy", "--docker", "--ci"]).stderr).not.toContain(warning);
    expect(runDeploy(["build", "--ci"]).stderr).not.toContain(warning);
  });
});
