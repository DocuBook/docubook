import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DocuBookPlugin, PageContext, PluginBuilder } from "@docubook/flame";
import pluginSearchAlgolia, { resolveClientFile } from "../index";
import { sameOriginUrl } from "../client/index";

type Hooks = {
  head: Array<(ctx: PageContext) => string | string[]>;
  end: Array<(...args: Parameters<Parameters<PluginBuilder["onEnd"]>[0]>) => unknown>;
  request: Array<Parameters<PluginBuilder["handleRequest"]>[0]>;
};

/** Collects the hooks a plugin registers, without flame's build machinery. */
function setup(plugin: DocuBookPlugin): Hooks {
  const hooks: Hooks = { head: [], end: [], request: [] };
  const noop = () => {};
  const builder = {
    config: {},
    onStart: noop,
    onLoad: noop,
    transformFrontmatter: noop,
    transformHtml: noop,
    injectBody: noop,
    remarkPlugins: noop,
    rehypePlugins: noop,
    injectHead: (cb: Hooks["head"][number]) => hooks.head.push(cb),
    onEnd: (cb: Hooks["end"][number]) => hooks.end.push(cb),
    handleRequest: (cb: Hooks["request"][number]) => hooks.request.push(cb),
  } as unknown as PluginBuilder;
  void plugin.setup(builder);
  return hooks;
}

const options = { appId: "APP123", apiKey: "search-key", indexName: "docs", askAi: "agent-1" };
const page = (pageType: PageContext["pageType"]) => ({ pageType }) as PageContext;
const assetManifest = { docs: { css: "d.css" }, notFound: { css: "s.css" } };

let clientDir: string;
let outDir: string;

beforeAll(async () => {
  const root = await mkdtemp(join(tmpdir(), "search-algolia-"));
  clientDir = join(root, "client");
  outDir = join(root, "dist");
  await mkdir(join(clientDir, "chunks"), { recursive: true });
  await writeFile(join(clientDir, "client.js"), "export default () => ({ open() {} });");
  await writeFile(join(clientDir, "style.css"), ".DocSearch{}");
  await writeFile(join(clientDir, "chunks", "docsearch-abc.js"), "export {};");
  await writeFile(join(root, "secret.txt"), "secret");
});

afterAll(async () => {
  await rm(join(clientDir, ".."), { recursive: true, force: true });
});

describe("pluginSearchAlgolia", () => {
  it("fails at load time on invalid options", () => {
    expect(() => pluginSearchAlgolia(undefined)).toThrow(/\[plugin:search-algolia\]/);
  });

  it("declares the provider on docs pages only", () => {
    const hooks = setup(pluginSearchAlgolia(options, { clientDir }));
    expect(hooks.head).toHaveLength(1);

    const head = [hooks.head[0](page("docs"))].flat();
    expect(head[0]).toBe(
      '<link rel="preconnect" href="https://APP123-dsn.algolia.net" crossorigin>'
    );
    const json = head[1].match(
      /^<script type="application\/json" id="docubook-search-provider">(.*)<\/script>$/
    )?.[1];
    expect(json).toBeDefined();
    const config = JSON.parse(json!);
    expect(config.module).toMatch(/^docsearch\/client\.js\?v=/);
    expect(config.askAi).toBe(true);
    expect(config.search.indices).toEqual([{ name: "docs" }]);
    expect(config.assistant.agentId).toBe("agent-1");

    expect(hooks.head[0](page("home"))).toEqual([]);
    expect(hooks.head[0](page("notFound"))).toEqual([]);
  });

  it("copies the browser build into the bundle directory", async () => {
    const hooks = setup(pluginSearchAlgolia(options, { clientDir }));
    const assetsDir = join(outDir, "docs", "_flame");
    await hooks.end[0]({} as never, [], { assetManifest, outDir, assetsDir } as never);
    expect(await readFile(join(assetsDir, "docsearch", "client.js"), "utf8")).toContain("open");
    expect(await readFile(join(assetsDir, "docsearch", "chunks", "docsearch-abc.js"), "utf8")).toBe(
      "export {};"
    );
  });

  describe("dev server", () => {
    const ctx = {
      port: 3000,
      hostname: "localhost",
      assetManifest,
      assetsPath: "/assets",
    } as never;
    const request = (hooks: Hooks, path: string) =>
      hooks.request[0](new Request(`http://localhost:3000${path}`), ctx);

    it("serves the browser build under the bundle path", async () => {
      const hooks = setup(pluginSearchAlgolia(options, { clientDir }));
      const js = (await request(hooks, "/assets/docsearch/client.js?v=1")) as Response;
      expect(js.status).toBe(200);
      expect(js.headers.get("Content-Type")).toBe("text/javascript; charset=utf-8");
      expect(await js.text()).toContain("open");

      const css = (await request(hooks, "/assets/docsearch/style.css")) as Response;
      expect(css.headers.get("Content-Type")).toBe("text/css; charset=utf-8");

      const chunk = (await request(hooks, "/assets/docsearch/chunks/docsearch-abc.js")) as Response;
      expect(chunk.status).toBe(200);
    });

    it("leaves other requests to flame", async () => {
      const hooks = setup(pluginSearchAlgolia(options, { clientDir }));
      expect(await request(hooks, "/assets/client-abc.js")).toBeUndefined();
      expect(await request(hooks, "/docs/getting-started")).toBeUndefined();
    });

    it("answers 404 for missing files and traversal attempts", async () => {
      const hooks = setup(pluginSearchAlgolia(options, { clientDir }));
      for (const path of [
        "/assets/docsearch/missing.js",
        "/assets/docsearch/chunks",
        "/assets/docsearch/..%2Fsecret.txt",
        "/assets/docsearch/chunks/..%2F..%2Fsecret.txt",
      ]) {
        expect(((await request(hooks, path)) as Response).status, path).toBe(404);
      }
      // The URL parser resolves dot segments before the plugin sees the path,
      // so this one is no longer below the prefix and stays flame's to answer.
      expect(await request(hooks, "/assets/docsearch/%2e%2e/secret.txt")).toBeUndefined();
    });
  });
});

describe("resolveClientFile", () => {
  it("rejects anything but plain relative segments", async () => {
    expect(await resolveClientFile(clientDir, "client.js")).toBe(join(clientDir, "client.js"));
    expect(await resolveClientFile(clientDir, "../secret.txt")).toBeNull();
    expect(await resolveClientFile(clientDir, "/etc/passwd")).toBeNull();
    expect(await resolveClientFile(clientDir, "%E0%A4%A")).toBeNull();
    expect(await resolveClientFile(clientDir, "chunks/.hidden")).toBeNull();
  });
});

describe("sameOriginUrl", () => {
  it("keeps path, query and hash of the crawled URL on the current origin", () => {
    expect(
      sameOriginUrl("https://docs.example.com/docs/a/b#install", "http://localhost:3000")
    ).toBe("/docs/a/b#install");
    expect(sameOriginUrl("https://docs.example.com/repo/docs/a.html?x=1", "http://localhost")).toBe(
      "/repo/docs/a.html?x=1"
    );
  });

  it("resolves relative hit URLs against the current origin", () => {
    expect(sameOriginUrl("/docs/a", "http://localhost")).toBe("/docs/a");
  });
});
