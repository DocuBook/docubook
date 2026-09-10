/** Client bundle builder for Node/Deno runtimes. */

import { execFile } from "node:child_process";
import { builtinModules, createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { promisify } from "node:util";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { build as viteBuild } from "vite";
import { ASSETS_DIR, FRAMEWORK_ROOT, LIB_DIR, STYLES_DIR, loadDocuConfig } from "./paths";
import { buildThemeCss, createMdxModuleEntries, getThemeConfig } from "./hydrate";
import { atomicWriteFile, computeTailwindCacheKey, readStyleCss } from "./cache-key";
import { resolveRoutes } from "./fs-scanner";
import { normalizeImporterPath } from "./security";
import type { AssetManifest, DocuConfig, DocuRoute } from "./types";

/** Extract Lucide icon names from user docu.json configuration. */
function extractConfigIcons(config: DocuConfig): string[] {
  const icons: string[] = [];
  const pushIf = (value: string | undefined) => {
    if (value) icons.push(value);
  };
  config.home?.hero?.actions?.forEach((action) => pushIf(action.icon));
  config.home?.features?.forEach((feature) => pushIf(feature.icon));
  (function walk(routes: DocuRoute[]) {
    for (const route of routes) {
      pushIf(route.context?.icon);
      if (route.items) walk(route.items);
    }
  })(config.routes ?? []);
  return [...new Set(icons.filter((name) => /^[A-Z]/.test(name)))];
}

export { buildThemeCss, computeInlineThemeCss, getThemeConfig } from "./hydrate";

export function viteChunkFileName(chunk: { name: string }): string {
  const name = chunk.name.replace(/^_docubook-mdx-page-/, "docubook-mdx-page-");
  return `chunks/${name}-[hash].js`;
}

const execFileAsync = promisify(execFile);

function resolveTailwindBin(): string {
  const require = createRequire(import.meta.url);
  const pkgPath = require.resolve("@tailwindcss/cli/package.json");
  const pkg = require(pkgPath) as { bin: string | Record<string, string> };
  const binRel = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.tailwindcss;
  return join(dirname(pkgPath), binRel);
}

function themeCacheSuffix(): string {
  try {
    const themeColors = getThemeConfig();
    return themeColors ? JSON.stringify(themeColors) : "";
  } catch {
    return "";
  }
}

function tailwindCacheKey(styleFile: string): string {
  return computeTailwindCacheKey(readStyleCss(styleFile), `${styleFile}\0${themeCacheSuffix()}`);
}

async function buildTailwindCss(
  name: string,
  styleFile: string
): Promise<{ file: string; content: string }> {
  const key = tailwindCacheKey(styleFile);
  const cachedFile = `${name}-${key}.css`;
  const cachedPath = join(ASSETS_DIR, cachedFile);

  if (existsSync(cachedPath)) {
    return { file: cachedFile, content: readFileSync(cachedPath, "utf-8") };
  }

  const tmpCss = join(ASSETS_DIR, `_tmp-${name}-${key}.css`);
  const bin = resolveTailwindBin();
  const tailwindArgs = ["-i", join(STYLES_DIR, styleFile), "-o", tmpCss, "--minify"];
  const isDeno = "Deno" in globalThis;
  const args = isDeno ? ["run", "-A", bin, ...tailwindArgs] : [bin, ...tailwindArgs];
  try {
    await execFileAsync(process.execPath, args, { maxBuffer: 16 * 1024 * 1024 });
  } catch (err) {
    const stderr = (err as { stderr?: string }).stderr ?? String(err);
    throw new Error(`Tailwind CSS build failed:\n${stderr}`, { cause: err });
  }

  let cssContent = await readFile(tmpCss, "utf-8");
  await unlink(tmpCss).catch(() => {});

  try {
    const themeColors = getThemeConfig();
    if (themeColors) cssContent = buildThemeCss(cssContent, themeColors);
  } catch (err) {
    console.warn(
      `[flame] Failed to resolve theme config: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!existsSync(cachedPath)) {
    await atomicWriteFile(writeFile, rename, unlink, cachedPath, cssContent);
  }

  return { file: cachedFile, content: cssContent };
}

const NODE_BUILTINS_RE = new RegExp(
  `^(node:.*|${builtinModules.map((module) => module.replace(/\//g, "\\/")).join("|")})$`
);

let lucideRealEntry: string | undefined;

function getLucideRealEntry(): string {
  if (!lucideRealEntry) {
    lucideRealEntry = createRequire(import.meta.url).resolve("lucide-react");
  }
  return lucideRealEntry;
}

const LUCIDE_IMPORT_RE = /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/g;
const LUCIDE_ICON_RE = /^[A-Z]/;

function scanDirLucideIcons(dir: string, set: Set<string>): void {
  if (!existsSync(dir)) return;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") scanDirLucideIcons(full, set);
      } else if (/\.(js|ts|tsx)$/.test(entry.name)) {
        const content = readFileSync(full, "utf-8");
        for (const match of content.matchAll(LUCIDE_IMPORT_RE)) {
          for (const specifier of match[1].split(",")) {
            const name = specifier
              .trim()
              .split(/\s+as\s+/)[0]
              .trim();
            if (LUCIDE_ICON_RE.test(name)) set.add(name);
          }
        }
      }
    }
  } catch (err) {
    console.warn(
      `[flame] Failed to scan lucide icons: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

function collectAllLucideIcons(): string[] {
  const icons = new Set<string>();
  scanDirLucideIcons(join(FRAMEWORK_ROOT, ".docu/components"), icons);
  scanDirLucideIcons(join(FRAMEWORK_ROOT, ".docu/pages"), icons);
  const dependencyDirs = [
    join(FRAMEWORK_ROOT, "..", "mdx-content", "dist"),
    join(FRAMEWORK_ROOT, "..", "ui-react", "dist"),
    join(FRAMEWORK_ROOT, "..", "core", "dist"),
    join(FRAMEWORK_ROOT, "..", "themes-colors", "dist"),
  ];
  for (const dir of dependencyDirs) scanDirLucideIcons(resolve(dir), icons);
  return [...icons];
}

export async function buildClientBundle(
  /** slug → compiled MDX ESM module source (program format) for static hydration. */
  mdxSources: Record<string, string> = {}
): Promise<AssetManifest> {
  await mkdir(ASSETS_DIR, { recursive: true });
  const nodeEnv = process.env.NODE_ENV || "development";
  const mdxEntries = createMdxModuleEntries(mdxSources);
  const mdxEntriesById = new Map(mdxEntries.map((entry) => [entry.id, entry]));
  const docsEntryPath = join(LIB_DIR, "client.ts");
  const homeEntryPath = join(LIB_DIR, "home-client.ts");

  const bundle = await viteBuild({
    configFile: false,
    publicDir: false,
    define: { "process.env.NODE_ENV": JSON.stringify(nodeEnv) },
    plugins: [
      {
        name: "node-builtin-stub",
        resolveId(id) {
          if (NODE_BUILTINS_RE.test(id)) return `\0node-stub:${id}`;
          return null;
        },
        load(id) {
          if (!id.startsWith("\0node-stub:")) return null;
          return "export default {}; export {};";
        },
      },
      {
        name: "lucide-optimize",
        resolveId(id, importer) {
          if (id !== "lucide-react") return null;
          if (importer) {
            const normalized = normalizeImporterPath(importer);
            if (normalized.includes("/markdown/dist/")) return null;
          }
          return "\0lucide-virt";
        },
        load(id) {
          if (id !== "\0lucide-virt") return null;
          const scanned = collectAllLucideIcons();
          const configured = extractConfigIcons(loadDocuConfig());
          const allIcons = [...new Set([...scanned, ...configured])];
          return `export { ${allIcons.join(", ")} } from ${JSON.stringify(getLucideRealEntry())};`;
        },
      },
      {
        name: "docu-config",
        resolveId(id) {
          if (!/client-routes$/.test(id)) return null;
          return "\0client-routes";
        },
        load(id) {
          if (id !== "\0client-routes") return null;
          const config = loadDocuConfig();
          const resolved = {
            ...config,
            routes: resolveRoutes(config.routes as DocuRoute[] | undefined),
          };
          return [
            `const docuConfig = ${JSON.stringify(resolved)};`,
            `export const routes = docuConfig.routes || [];`,
            `export const config = docuConfig;`,
          ].join("\n");
        },
      },
      {
        name: "mdx-hydrate",
        resolveId(id) {
          if (/mdx-manifest$/.test(id)) return "\0mdx-manifest";
          if (/^docubook-mdx-page-[a-f0-9]{16}$/.test(id)) return `\0${id}`;
          return null;
        },
        load(id) {
          if (id === "\0mdx-manifest") {
            const map = mdxEntries
              .map(({ slug, id }) => `${JSON.stringify(slug)}: () => import(${JSON.stringify(id)})`)
              .join(", ");
            return `export const mdxModules = { ${map} };\n`;
          }
          if (!id.startsWith("\0docubook-mdx-page-")) return null;
          const entry = mdxEntriesById.get(id.slice(1));
          const contents = entry == null ? undefined : mdxSources[entry.slug];
          if (contents == null) throw new Error(`unknown mdx module: ${id}`);
          return contents;
        },
      },
    ],
    build: {
      outDir: ASSETS_DIR,
      emptyOutDir: false,
      sourcemap: true,
      minify: nodeEnv === "production",
      target: "es2020",
      rollupOptions: {
        input: { client: docsEntryPath, "home-client": homeEntryPath },
        output: {
          format: "es",
          entryFileNames: "[name]-[hash].js",
          chunkFileNames: viteChunkFileName,
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
    },
  });

  const outputs = Array.isArray(bundle) ? bundle : [bundle];
  let docsJs: string | undefined;
  let homeJs: string | undefined;
  for (const item of outputs) {
    if (!("output" in item)) continue;
    for (const output of item.output) {
      if (output.type !== "chunk" || !output.isEntry) continue;
      if (output.name === "client") docsJs = output.fileName;
      if (output.name === "home-client") homeJs = output.fileName;
    }
  }
  if (!docsJs || !homeJs) {
    throw new Error("Client bundle produced incomplete entry-point outputs");
  }

  const [{ file: docsCss }, { file: siteCss }] = await Promise.all([
    buildTailwindCss("docs", "globals.css"),
    buildTailwindCss("site", "site.css"),
  ]);

  const manifest: AssetManifest = {
    docs: { js: docsJs, css: docsCss },
    home: { js: homeJs, css: siteCss },
    notFound: { css: siteCss },
  };
  await writeFile(join(ASSETS_DIR, "manifest.json"), JSON.stringify(manifest));
  return manifest;
}
