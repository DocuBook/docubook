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
