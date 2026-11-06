import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
  DocuBookPlugin,
  DocuConfig,
  PageContext,
  PageMeta,
  PluginBuilder,
} from "@docubook/flame";
import pluginOgImage, { type Logger, type OgImageOptions, type PluginInternals } from "../index";
import { createEngine, pngSize, type Engine } from "../renderer";

type FrontmatterHook = Parameters<PluginBuilder["transformFrontmatter"]>[0];
type Hooks = {
  start: Array<(config: DocuConfig) => unknown>;
  frontmatter: FrontmatterHook[];
  head: Array<(ctx: PageContext) => string | string[]>;
  end: Array<(config: DocuConfig, pages: PageMeta[], ctx: { outDir: string }) => unknown>;
  request: Array<Parameters<PluginBuilder["handleRequest"]>[0]>;
};

const LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#2483e2"/></svg>';

let root: string;
let outDir: string;
let messages: { info: string[]; warn: string[] };
let renders: number;

const log: Logger = {
  info: (m) => messages.info.push(m),
  warn: (m) => messages.warn.push(m),
};

/** Counts renders and draws with the real engine. */
const countingEngine = async (fonts: Parameters<typeof createEngine>[0]): Promise<Engine> => {
  const engine = await createEngine(fonts);
  return {
    ...engine,
    render: (tree) => {
      renders++;
      return engine.render(tree);
    },
  };
};

function setup(plugin: DocuBookPlugin, config: DocuConfig): Hooks {
  const hooks: Hooks = { start: [], frontmatter: [], head: [], end: [], request: [] };
  const noop = () => {};
  const builder = {
    config,
    onLoad: noop,
    transformHtml: noop,
    injectBody: noop,
    remarkPlugins: noop,
    rehypePlugins: noop,
    onStart: (cb: Hooks["start"][number]) => hooks.start.push(cb),
    transformFrontmatter: (cb: FrontmatterHook) => hooks.frontmatter.push(cb),
    injectHead: (cb: Hooks["head"][number]) => hooks.head.push(cb),
    onEnd: (cb: Hooks["end"][number]) => hooks.end.push(cb),
    handleRequest: (cb: Hooks["request"][number]) => hooks.request.push(cb),
  } as unknown as PluginBuilder;
  void plugin.setup(builder);
  return hooks;
}

function makeConfig(
  meta: Record<string, unknown> = {},
  extra: Record<string, unknown> = {}
): DocuConfig {
  return {
    meta: {
      title: "Acme Docs",
      description: "Docs for Acme.",
      baseURL: "https://acme.dev",
      ...meta,
    },
    navbar: { logoText: "Acme", logo: { src: "/docs/assets/logo.svg" } },
    routes: [{ title: "Guides", href: "/guides" }],
    home: { hero: { headline: "Ship docs fast." } },
    ...extra,
  } as unknown as DocuConfig;
}

function load(
  options: OgImageOptions = {},
  config = makeConfig(),
  internals: PluginInternals = {}
) {
  const hooks = setup(
    pluginOgImage(options, {
      root,
      log,
      version: "1.0.0",
      createEngine: countingEngine,
      ...internals,
    }),
    config
  );
  const run = {
    hooks,
    config,
    start: () => Promise.all(hooks.start.map((cb) => cb(config))),
    frontmatter: (frontmatter: Record<string, unknown>, slug: string) =>
      hooks.frontmatter[0](frontmatter, { slug, filePath: `docs/${slug}.mdx`, content: "" }) ??
      frontmatter,
    head: (ctx: Partial<PageContext>) =>
      [
        hooks.head[0]({ pageType: "docs", slug: "", frontmatter: {}, ...ctx } as PageContext),
      ].flat(),
    end: (slugs: string[]) =>
      hooks.end[0](
        config,
        slugs.map((slug) => ({ slug }) as PageMeta),
        { outDir }
      ),
    request: (path: string) =>
      hooks.request[0](new Request(`http://localhost:3000${path}`), {} as never),
  };
  return run;
}

async function cards(): Promise<string[]> {
  const dir = join(outDir, "docs/assets/og");
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => []);
  return entries
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name).slice(dir.length + 1))
    .sort();
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "og-plugin-"));
  outDir = join(root, ".docu/dist");
  messages = { info: [], warn: [] };
  renders = 0;
  await mkdir(join(root, "docs/assets"), { recursive: true });
  await mkdir(join(root, "docs/guides"), { recursive: true });
  await writeFile(join(root, "docu.json"), "{}");
  await writeFile(join(root, "docs/assets/logo.svg"), LOGO);
  await writeFile(
    join(root, "docs/index.mdx"),
    "---\ntitle: Welcome\ndescription: Start here.\n---\n"
  );
  await writeFile(
    join(root, "docs/guides/setup.mdx"),
    "---\ntitle: Setup\ndescription: Install it.\n---\n"
  );
  await writeFile(
    join(root, "docs/guides/custom.mdx"),
    "---\ntitle: Custom\nimage: https://cdn.acme.dev/c.png\n---\n"
  );
  await writeFile(join(root, "docs/guides/hidden.mdx"), "---\ntitle: Hidden\nog: false\n---\n");
});
afterEach(() => rm(root, { recursive: true, force: true }));

const ALL = ["guides/setup", "guides/custom", "guides/hidden"];

describe("transformFrontmatter", () => {
  it("points a page without an image at its card", () => {
    const run = load();
    const fm = run.frontmatter({ title: "Setup", description: "Install it." }, "guides/setup");
    expect(fm.image).toMatch(/^\.\/assets\/og\/guides\/setup\.[0-9a-f]{8}\.png$/);
  });

  it("leaves author images, opted-out pages and disabled kinds alone", () => {
    const run = load({ pages: { index: false } });
    expect(run.frontmatter({ image: "./me.png" }, "a")).toEqual({ image: "./me.png" });
    expect(run.frontmatter({ og: false }, "a")).toEqual({ og: false });
    expect(run.frontmatter({ title: "Welcome" }, "")).toEqual({ title: "Welcome" });
  });

  it("skips the docs index flame does not write at a root deployment", () => {
    const run = load({}, makeConfig({ basePath: "" }));
    expect(run.frontmatter({ title: "Welcome" }, "")).toEqual({ title: "Welcome" });
  });
});

describe("injectHead", () => {
  it("describes the card on pages that show it", () => {
    const run = load();
    const fm = run.frontmatter({ title: 'Say "hi" <now>' }, "guides/setup");
    expect(run.head({ slug: "guides/setup", frontmatter: fm })).toEqual([
      `<meta property="og:image:width" content="1200">`,
      `<meta property="og:image:height" content="630">`,
      `<meta property="og:image:type" content="image/png">`,
      `<meta property="og:image:alt" content="Say &quot;hi&quot; &lt;now&gt;">`,
    ]);
  });

  it("adds nothing to pages with their own image", () => {
    const run = load();
    expect(run.head({ slug: "a", frontmatter: { image: "./me.png" } })).toEqual([]);
    expect(run.head({ slug: "a", frontmatter: { og: false } })).toEqual([]);
  });

  it("gives the landing page an absolute og:image unless meta.ogImage sets one", () => {
    const tags = load().head({ pageType: "home" });
    expect(tags[0]).toMatch(
      /^<meta property="og:image" content="https:\/\/acme\.dev\/docs\/assets\/og\/home\.[0-9a-f]{8}\.png">$/
    );
    expect(tags).toContain(`<meta property="og:image:alt" content="Ship docs fast.">`);
    expect(load({}, makeConfig({ ogImage: "/docs/og.png" })).head({ pageType: "home" })).toEqual(
      []
    );
    expect(load({ pages: { home: false } }).head({ pageType: "home" })).toEqual([]);
    expect(load().head({ pageType: "notFound" })).toEqual([]);
  });
});

describe("onEnd", () => {
  it("writes the cards each page points at, and only those", async () => {
    const run = load();
    await run.start();
    const setup = run.frontmatter({ title: "Setup", description: "Install it." }, "guides/setup");
    const index = run.frontmatter({ title: "Welcome", description: "Start here." }, "");
    await run.end(ALL);

    const files = await cards();
    expect(files).toHaveLength(3);
    expect(files).toContain((setup.image as string).replace("./assets/og/", ""));
    expect(files).toContain((index.image as string).replace("./assets/og/", ""));
    expect(files.some((f) => /^home\.[0-9a-f]{8}\.png$/.test(f))).toBe(true);
    const png = await readFile(join(outDir, "docs", setup.image as string));
    expect(pngSize(png)).toEqual({ width: 1200, height: 630 });
    expect(messages.info).toEqual([
      expect.stringMatching(
        /^3 cards: 3 rendered, 0 unchanged, 2 pages use their own image \(\d+ms\)$/
      ),
    ]);
  });

  it("renders nothing on a build where nothing changed, even with no page hooks run", async () => {
    await load().end(ALL);
    renders = 0;
    const warm = load();
    await warm.end(ALL);
    expect(renders).toBe(0);
    expect(messages.info.at(-1)).toMatch(/3 cards: 0 rendered, 3 unchanged/);
  });

  it("re-renders under the same names when the logo changes", async () => {
    await load().end(ALL);
    const before = await cards();
    await writeFile(join(root, "docs/assets/logo.svg"), LOGO.replace("#2483e2", "#e22424"));
    renders = 0;
    await load().end(ALL);
    expect(renders).toBe(3);
    expect(await cards()).toEqual(before);
  });

  it("removes the card of a deleted page", async () => {
    await load().end(ALL);
    await rm(join(root, "docs/guides/setup.mdx"));
    await load().end(["guides/custom", "guides/hidden"]);
    expect((await cards()).some((f) => f.startsWith("guides/"))).toBe(false);
    expect(messages.info.at(-1)).toMatch(/1 removed/);
  });

  it("writes cards below a custom prefix", async () => {
    await load({}, makeConfig({ basePath: "/guide" })).end(["guides/setup"]);
    const entries = await readdir(join(outDir, "guide/assets/og/guides"));
    expect(entries).toEqual([expect.stringMatching(/^setup\.[0-9a-f]{8}\.png$/)]);
  });

  it("warns about characters no font can draw", async () => {
    await writeFile(join(root, "docs/guides/setup.mdx"), "---\ntitle: Łódź → Kraków\n---\n");
    await load().end(["guides/setup"]);
    expect(messages.warn).toEqual([
      expect.stringContaining(`no loaded font can draw "Ł", "ź", "→"`),
    ]);
    expect(messages.warn[0]).toContain("Pages: guides/setup.");
  });
});

describe("onStart", () => {
  it("warns without meta.baseURL", async () => {
    await load({}, makeConfig({ baseURL: "" })).start();
    expect(messages.warn).toEqual([expect.stringContaining("meta.baseURL is not set")]);
  });

  it("renders without a logo it cannot use", async () => {
    const config = makeConfig();
    (config.navbar as { logo: { src: string } }).logo.src = "https://cdn.acme.dev/logo.svg";
    await load({}, config).start();
    expect(messages.warn).toEqual([
      expect.stringContaining(`navbar.logo.src "https://cdn.acme.dev/logo.svg" is a URL`),
    ]);
  });

  it("fails when a configured font is missing", async () => {
    await expect(load({ fonts: [{ path: "fonts/none.ttf" }] }).start()).rejects.toThrow(
      /font "fonts\/none.ttf" could not be read/
    );
  });
});

describe("setup", () => {
  it("rejects files outside the project", () => {
    expect(() => load({ logo: "../logo.svg" })).toThrow(/"logo" must point inside the project/);
    expect(() => load({ fonts: [{ path: "/etc/font.ttf" }] })).toThrow(
      /"fonts\[0\].path" must point inside/
    );
  });
});

describe("handleRequest (flame dev)", () => {
  it("renders the current card for a page", async () => {
    const run = load();
    const fm = run.frontmatter({ title: "Setup", description: "Install it." }, "guides/setup");
    const res = await run.request(`/docs/${(fm.image as string).slice(2)}`);
    expect(res?.status).toBe(200);
    expect(res?.headers.get("Content-Type")).toBe("image/png");
    expect(pngSize(new Uint8Array(await res!.arrayBuffer()))).toEqual({ width: 1200, height: 630 });
  });

  it("serves a page's current card for a stale hash, and the landing card", async () => {
    const run = load();
    expect((await run.request("/docs/assets/og/guides/setup.00000000.png"))?.status).toBe(200);
    expect((await run.request("/docs/assets/og/home.00000000.png"))?.status).toBe(200);
    expect((await run.request("/docs/assets/og/index.00000000.png"))?.status).toBe(200);
  });

  it("answers 404 for unknown or malformed card paths", async () => {
    const run = load();
    for (const path of [
      "/docs/assets/og/guides/none.00000000.png",
      "/docs/assets/og/guides/setup.png",
      "/docs/assets/og/guides%2F..%2F..%2Fdocu.00000000.png",
      "/docs/assets/og/%E0%A4%A.00000000.png",
    ]) {
      expect((await run.request(path))?.status, path).toBe(404);
    }
  });

  it("leaves other requests to flame", async () => {
    expect(await load().request("/docs/assets/logo.svg")).toBeUndefined();
  });
});
