import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { build } from "vite";
import type { Rollup } from "vite";
import { nodeBuiltinStubPlugin } from "../node/hydrate.node";

let dir: string | undefined;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

async function bundle(entrySource: string): Promise<string> {
  dir = mkdtempSync(join(tmpdir(), "flame-builtin-stub-"));
  writeFileSync(join(dir, "entry.ts"), entrySource);
  const result = (await build({
    configFile: false,
    logLevel: "silent",
    root: dir,
    plugins: [nodeBuiltinStubPlugin()],
    build: {
      write: false,
      minify: false,
      rollupOptions: { input: join(dir, "entry.ts") },
    },
  })) as Rollup.RollupOutput | Rollup.RollupOutput[];
  const outputs = Array.isArray(result) ? result : [result];
  return outputs
    .flatMap((output) => output.output)
    .map((chunk) => (chunk.type === "chunk" ? chunk.code : ""))
    .join("\n");
}

describe("nodeBuiltinStubPlugin", () => {
  // Regression guard for #418: a server module leaking into the client graph
  // must fail the build, not ship a bundle that crashes every page.
  it("fails the build when client code needs a named Node built-in export", async () => {
    await expect(
      bundle('import { resolve } from "node:path";\nconsole.log(resolve("a", "b"));\n')
    ).rejects.toThrow(/resolve.*not exported|MISSING_EXPORT/s);
  });

  it("serves an empty default export for browser-safe default imports", async () => {
    const code = await bundle('import fs from "fs";\nconsole.log(typeof fs, Object.keys(fs));\n');
    expect(code).not.toContain("__vite-browser-external");
    expect(code).toContain("console.log");
  });
});
