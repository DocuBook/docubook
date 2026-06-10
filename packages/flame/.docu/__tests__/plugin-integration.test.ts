import { describe, it, expect } from "vitest";
import { htmlShell } from "../node/html";
import { createBuilder, createMockPlugin, createFaultyPlugin, pageCtx, htmlOpts } from "./helpers";

// ─── Integration: Loader + Builder together ──────────────

describe("Plugin lifecycle — loader + builder integration", () => {
  it("loads plugin, sets up builder, executes all hooks in order", async () => {
    const plugin = createMockPlugin("test-integration");
    const builder = createBuilder(["test-integration"]);

    await plugin.setup(builder);

    expect(plugin.logs.some((l) => l.hook === "setup")).toBe(true);

    // [1] onStart
    await builder.runOnStart();
    expect(plugin.logs.find((l) => l.hook === "onStart")).toBeDefined();

    // [2] onLoad
    const loadResult = await builder.runOnLoad("/path/to/page.mdx", "Hello World");
    expect(loadResult?.contents).toBe("Hi World");
    const loadNoMatch = await builder.runOnLoad("/path/to/data.json", "Hello");
    expect(loadNoMatch).toBeNull();

    // [3] transformFrontmatter
    const fm = await builder.runTransformFrontmatterChain(
      { title: "Test" },
      { slug: "page", filePath: "page.mdx" }
    );
    expect(fm.processed).toBe(true);
    expect(fm.pluginName).toBe("test-integration");
    expect(fm.title).toBe("Test");

    // [4-5] injectHead / injectBody
    const ctx = pageCtx({ slug: "page", filePath: "page.mdx", frontmatter: fm as any });
    const headExtra = builder.collectHead(ctx);
    const bodyExtra = builder.collectBody(ctx);
    expect(headExtra).toContain('<meta name="plugin" content="test-integration">');
    expect(bodyExtra).toContain('<div id="plugin-widget">Plugin Widget</div>');

    // [6-7] remark / rehype
    expect(builder.collectRemarkPlugins()).toEqual([]);
    expect(builder.collectRehypePlugins()).toEqual([]);

    // [8] transformHtml
    const html = await builder.runTransformHtmlChain(
      "<html><body><p>Content</p></body></html>",
      ctx
    );
    expect(html).toContain("<!-- Plugin Footer -->");

    // [9] onEnd
    const pages = [
      { slug: "page", title: "Page", filePath: "page.mdx", outputPath: "dist/page.html" },
    ];
    await builder.runOnEnd(pages);
    const onEndLog = plugin.logs.find((l) => l.hook === "onEnd");
    expect(onEndLog!.args[0]).toBe(1);

    // [10] handleRequest
    const result = await builder.runHandleRequest(new Request("http://test.dev/api/plugin"), {
      port: 3000,
      hostname: "localhost",
    });
    expect(result).toBeNull();

    // Verify execution order
    const order = plugin.logs.filter((l) => l.hook !== "setup").map((l) => l.hook);

    const expectedOrder = [
      "onStart",
      "onLoad",
      "transformFrontmatter",
      "injectHead",
      "injectBody",
      "remarkPlugins",
      "rehypePlugins",
      "transformHtml",
      "onEnd",
      "handleRequest",
    ];

    let lastIdx = -1;
    for (const hook of expectedOrder) {
      const idx = order.indexOf(hook);
      expect(idx).toBeGreaterThan(lastIdx);
      lastIdx = idx;
    }

    expect(plugin.logs.filter((l) => l.hook === "onStart")).toHaveLength(1);
  });
});

// ─── Integration: builder + html.ts ──────────────────────

describe("Plugin integration — HTML output", () => {
  it("includes plugin head/body injections in final HTML", async () => {
    const plugin = createMockPlugin("html-plugin");
    const builder = createBuilder(["html-plugin"]);
    plugin.setup(builder);

    const ctx = pageCtx({ slug: "test-page", filePath: "test-page.mdx" });
    const headExtra = builder.collectHead(ctx);
    const bodyExtra = builder.collectBody(ctx);

    const html = htmlShell(htmlOpts("<p>Content</p>", { headExtra, bodyExtra }));

    // Head injection position
    expect(html).toContain('<meta name="plugin" content="html-plugin">');
    expect(html.indexOf('<meta name="plugin"')).toBeLessThan(html.indexOf("</head>"));

    // Body injection position
    expect(html).toContain('<div id="plugin-widget">Plugin Widget</div>');
    expect(html.indexOf('<div id="plugin-widget"')).toBeLessThan(html.indexOf("</body>"));

    // transformHtml
    const transformed = await builder.runTransformHtmlChain(html, ctx);
    expect(transformed).toContain("<!-- Plugin Footer -->");
    expect(transformed.indexOf("<!-- Plugin Footer -->")).toBeLessThan(
      transformed.indexOf("</body>")
    );
  });
});

// ─── No-op mode: zero plugins ───────────────────────────

describe("Plugin integration — no-op mode", () => {
  it("all operations succeed without throwing", async () => {
    const builder = createBuilder();

    await expect(
      (async () => {
        await builder.runOnStart();
        await builder.runOnLoad("page.mdx", "content");
        await builder.runTransformFrontmatterChain({}, { slug: "p", filePath: "p.mdx" });
        await builder.runTransformHtmlChain("<p>test</p>", {} as any);
        await builder.runOnEnd([]);
      })()
    ).resolves.toBeUndefined();
  });

  it("returns empty arrays when no plugins registered", () => {
    const builder = createBuilder();
    expect(builder.collectHead({} as any)).toEqual([]);
    expect(builder.collectBody({} as any)).toEqual([]);
    expect(builder.collectRemarkPlugins()).toEqual([]);
    expect(builder.collectRehypePlugins()).toEqual([]);
    expect(builder.runOnLoad("page.mdx", "content")).resolves.toBeNull();
  });
});

// ─── Multiple plugins integration ───────────────────────

describe("Plugin integration — multiple plugins", () => {
  it("executes hooks from multiple plugins in registration order", async () => {
    const pluginA = createMockPlugin("plugin-a");
    const pluginB = createMockPlugin("plugin-b");
    const builder = createBuilder(["plugin-a", "plugin-b"]);

    await pluginA.setup(builder);
    await pluginB.setup(builder);
    await builder.runOnStart();

    expect(pluginA.logs.find((l) => l.hook === "onStart")).toBeDefined();
    expect(pluginB.logs.find((l) => l.hook === "onStart")).toBeDefined();

    const ctx = pageCtx({ slug: "multi", filePath: "multi.mdx" });
    const headExtra = builder.collectHead(ctx);
    expect(headExtra.filter((h) => h.includes("plugin-a"))).toHaveLength(1);
    expect(headExtra.filter((h) => h.includes("plugin-b"))).toHaveLength(1);

    const html = await builder.runTransformHtmlChain("<html><body>Content</body></html>", ctx);
    expect(html).toContain("<!-- Plugin Footer -->");
  });
});

// ─── Error isolation ─────────────────────────────────────

describe("Plugin integration — error isolation", () => {
  it("onStart fail-fast propagates error", async () => {
    const builder = createBuilder(["faulty"]);
    await createFaultyPlugin("onStart").setup(builder);
    await expect(builder.runOnStart()).rejects.toThrow("onStart failure");
  });

  it("handleRequest isolates errors", async () => {
    const builder = createBuilder(["faulty", "working"]);
    const working = createMockPlugin("working");
    await createFaultyPlugin("handleRequest").setup(builder);
    await working.setup(builder);

    const before = working.logs.length;
    const result = await builder.runHandleRequest(new Request("http://test.dev"), {
      port: 3000,
      hostname: "localhost",
    });
    expect(result).toBeNull();
    expect(working.logs.length).toBeGreaterThan(before);
  });

  it("injectHead fail-fast propagates error", async () => {
    const builder = createBuilder(["faulty"]);
    await createFaultyPlugin("injectHead").setup(builder);
    expect(() => builder.collectHead({} as any)).toThrow("injectHead failure");
  });
});
