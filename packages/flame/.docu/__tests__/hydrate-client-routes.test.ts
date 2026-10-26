import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { build } from "vite";
import type { Rollup } from "vite";
import { docuConfigPlugin } from "../node/hydrate.node";

let dir: string | undefined;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

describe("docuConfigPlugin", () => {
  // Regression: `node/client-routes.ts` exists on disk, so without
  // `enforce: "pre"` Vite's resolver bundled the real server module (paths.ts,
  // node built-ins) into the browser and every page failed to hydrate.
  it("replaces client-routes even when a real file of that name exists", async () => {
    dir = mkdtempSync(join(tmpdir(), "flame-client-routes-"));
    writeFileSync(
      join(dir, "client-routes.ts"),
      'export const config = { marker: "SERVER_SIDE_CLIENT_ROUTES" };\n'
    );
    writeFileSync(
      join(dir, "entry.ts"),
      'import { config, basePath } from "./client-routes";\nconsole.log(config, basePath);\n'
    );

    const result = (await build({
      configFile: false,
      logLevel: "silent",
      root: dir,
      plugins: [docuConfigPlugin()],
      build: {
        write: false,
        minify: false,
        rollupOptions: { input: join(dir, "entry.ts") },
      },
    })) as Rollup.RollupOutput | Rollup.RollupOutput[];

    const outputs = Array.isArray(result) ? result : [result];
    const code = outputs
      .flatMap((output) => output.output)
      .map((chunk) => (chunk.type === "chunk" ? chunk.code : ""))
      .join("\n");

    expect(code).not.toContain("SERVER_SIDE_CLIENT_ROUTES");
    expect(code).toContain("docuConfig");
  });
});
