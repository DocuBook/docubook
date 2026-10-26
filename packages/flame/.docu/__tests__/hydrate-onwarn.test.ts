import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { build } from "vite";
import type { Rollup } from "vite";
import { clientBuildOnWarn } from "../node/hydrate.node";

let dir: string | undefined;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

/** Bundle a module; return every warning raised and those clientBuildOnWarn lets through. */
async function bundleWarnings(
  source: string
): Promise<{ raised: Rollup.RollupLog[]; surfaced: Rollup.RollupLog[] }> {
  dir = mkdtempSync(join(tmpdir(), "flame-onwarn-"));
  writeFileSync(join(dir, "entry.ts"), source);
  const raised: Rollup.RollupLog[] = [];
  const surfaced: Rollup.RollupLog[] = [];
  await build({
    configFile: false,
    logLevel: "silent",
    root: dir,
    build: {
      write: false,
      minify: false,
      rollupOptions: {
        input: join(dir, "entry.ts"),
        onwarn: (warning) => {
          raised.push(warning);
          clientBuildOnWarn(warning, (w) => surfaced.push(w));
        },
      },
    },
  });
  return { raised, surfaced };
}

const codes = (logs: Rollup.RollupLog[]) => logs.map((log) => log.code);

describe("clientBuildOnWarn", () => {
  // Every "use client" component — and the '' left by JSDoc-only @import
  // blocks in the MDX toolchain — used to print a multi-line Rolldown
  // diagnostic on each build, burying real output in CI logs.
  it.each([
    ["use client", '"use client";\nexport const x = 1;\nconsole.log(x);\n'],
    ["an empty-string statement", "/** @import {A} from 'a' */\n'';\nconsole.log(1);\n"],
  ])("hides MODULE_LEVEL_DIRECTIVE warnings for %s", async (_label, source) => {
    const { raised, surfaced } = await bundleWarnings(source);
    expect(codes(raised)).toContain("MODULE_LEVEL_DIRECTIVE");
    expect(codes(surfaced)).not.toContain("MODULE_LEVEL_DIRECTIVE");
  });

  it("keeps other directive warnings", async () => {
    const { surfaced } = await bundleWarnings(
      '"use server";\nexport const x = 1;\nconsole.log(x);\n'
    );
    expect(codes(surfaced)).toContain("MODULE_LEVEL_DIRECTIVE");
  });

  it("passes unrelated warnings through unchanged", () => {
    const forwarded: Rollup.RollupLog[] = [];
    const warning = { code: "CIRCULAR_DEPENDENCY", message: "Circular dependency: a -> b -> a" };
    clientBuildOnWarn(warning, (w) => forwarded.push(w));
    expect(forwarded).toEqual([warning]);
  });
});
