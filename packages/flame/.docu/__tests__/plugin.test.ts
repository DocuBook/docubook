import { describe, it, expect, vi, beforeEach } from "vitest";
import { BuildPluginBuilder } from "../node/plugin-builder";
import { htmlShell } from "../node/html.shared";
import { createBuilder, pageCtx, htmlOpts, devCtx } from "./helpers";
import type { Pluggable } from "unified";

// ─── PluginBuilder Registration Tests ────────────────────

describe("BuildPluginBuilder — Registration", () => {
  let builder: BuildPluginBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it("stores config on construction", () => {
    expect(builder.config).toBeDefined();
    expect(builder.config.meta.title).toBe("Test");
  });

  function expectRegisterMethod(method: keyof BuildPluginBuilder) {
    const cb = vi.fn();
    (builder[method] as (...args: unknown[]) => unknown)(cb);
    expect(typeof builder[method]).toBe("function");
  }

  it("registers onStart callbacks", () => expectRegisterMethod("onStart"));
  it("registers onEnd callbacks", () => expectRegisterMethod("onEnd"));

  it("registers onLoad handlers with filter", () => {
    const cb = vi.fn();
    builder.onLoad({ filter: /\.mdx$/ }, cb);
    expect(typeof builder.onLoad).toBe("function");
  });

  it("registers transformFrontmatter callbacks", () =>
    expectRegisterMethod("transformFrontmatter"));
  it("registers transformHtml callbacks", () => expectRegisterMethod("transformHtml"));
  it("registers injectHead callbacks", () => expectRegisterMethod("injectHead"));
  it("registers injectBody callbacks", () => expectRegisterMethod("injectBody"));
  it("registers remarkPlugins callbacks", () => expectRegisterMethod("remarkPlugins"));
  it("registers rehypePlugins callbacks", () => expectRegisterMethod("rehypePlugins"));
  it("registers handleRequest callbacks", () => expectRegisterMethod("handleRequest"));
});

// ─── PluginBuilder Execution Tests ───────────────────────

describe("BuildPluginBuilder — Execution", () => {
  let builder: BuildPluginBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  const pageCtxFor = (slug: string) => pageCtx({ slug, filePath: `${slug}.mdx` });

  describe("runOnStart", () => {
    it("calls registered callbacks in order", async () => {
      const order: number[] = [];
      builder.onStart(async () => {
        order.push(1);
      });
      builder.onStart(async () => {
        order.push(2);
      });
      builder.onStart(async () => {
        order.push(3);
      });
      await builder.runOnStart();
      expect(order).toEqual([1, 2, 3]);
    });

    it("passes config to callbacks", async () => {
      const spy = vi.fn();
      builder.onStart(spy);
      await builder.runOnStart();
      expect(spy).toHaveBeenCalledWith(builder.config);
    });

    it("awaits async callbacks", async () => {
      let resolved = false;
      builder.onStart(async () => {
        await new Promise((r) => setTimeout(r, 10));
        resolved = true;
      });
      await builder.runOnStart();
      expect(resolved).toBe(true);
    });

    it("resolves when no callbacks registered", async () => {
      await expect(builder.runOnStart()).resolves.toBeUndefined();
    });
  });

  describe("runOnEnd", () => {
    it("calls callbacks with config and pages", async () => {
      const spy = vi.fn();
      const pages = [
        { slug: "test", title: "Test", filePath: "/test.mdx", outputPath: "/test.html" },
      ];
      builder.onEnd(spy);
      await builder.runOnEnd(pages);
      expect(spy).toHaveBeenCalledWith(builder.config, pages);
    });
  });

  describe("runOnLoad", () => {
    it("matches file by filter regex", async () => {
      const spy = vi.fn(({ content }: { content: string }) => ({
        contents: content.toUpperCase(),
      }));
      builder.onLoad({ filter: /\.mdx$/ }, spy);
      const result = await builder.runOnLoad("/path/to/page.mdx", "hello world");
      expect(result).toEqual({ contents: "HELLO WORLD" });
    });

    it("skips files not matching filter", async () => {
      const spy = vi.fn();
      builder.onLoad({ filter: /\.mdx$/ }, spy);
      const result = await builder.runOnLoad("/path/to/data.json", "{}");
      expect(result).toBeNull();
      expect(spy).not.toHaveBeenCalled();
    });

    it("first matching handler wins", async () => {
      const spy1 = vi.fn(() => ({ contents: "from-first" }));
      builder.onLoad({ filter: /\.md$/ }, spy1);
      builder.onLoad(
        { filter: /\.md$/ },
        vi.fn(() => ({ contents: "from-second" }))
      );
      const result = await builder.runOnLoad("page.md", "original");
      expect(result).toEqual({ contents: "from-first" });
    });

    it("returns null when handler returns void", async () => {
      builder.onLoad({ filter: /.*/ }, () => {});
      const result = await builder.runOnLoad("page.md", "content");
      expect(result).toBeNull();
    });
  });

  describe("runTransformFrontmatterChain", () => {
    it("chains transforms in waterfall pattern", async () => {
      builder.transformFrontmatter((fm) => ({ ...fm, a: 1 }));
      builder.transformFrontmatter((fm) => ({ ...fm, b: fm.a }));
      const result = await builder.runTransformFrontmatterChain({}, pageCtxFor("test"));
      expect(result).toEqual({ a: 1, b: 1 });
    });

    it("preserves original when callback returns void", async () => {
      builder.transformFrontmatter(() => {});
      const result = await builder.runTransformFrontmatterChain(
        { original: true },
        pageCtxFor("test")
      );
      expect(result).toEqual({ original: true });
    });

    it("skips array return with warning", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      builder.transformFrontmatter(() => [] as any);
      const result = await builder.runTransformFrontmatterChain({ key: "val" }, pageCtxFor("test"));
      expect(result).toEqual({ key: "val" });
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/invalid type.*skipping/));
      warn.mockRestore();
    });

    it("skips string return with warning", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      builder.transformFrontmatter(() => "oops" as any);
      const result = await builder.runTransformFrontmatterChain({ key: "val" }, pageCtxFor("test"));
      expect(result).toEqual({ key: "val" });
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/invalid type.*skipping/));
      warn.mockRestore();
    });

    it("skips numeric return with warning", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      builder.transformFrontmatter(() => 42 as any);
      const result = await builder.runTransformFrontmatterChain({ key: "val" }, pageCtxFor("test"));
      expect(result).toEqual({ key: "val" });
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/invalid type.*skipping/));
      warn.mockRestore();
    });
  });

  describe("runTransformHtmlChain", () => {
    it("chains HTML transforms", async () => {
      builder.transformHtml((html) => html.replace("foo", "bar"));
      builder.transformHtml((html) => `<wrapper>${html}</wrapper>`);
      const result = await builder.runTransformHtmlChain("<p>foo</p>", null as any);
      expect(result).toBe("<wrapper><p>bar</p></wrapper>");
    });
  });

  describe("collectHead / collectBody", () => {
    const noCtx = null as any;

    it("collects and deduplicates head injections", () => {
      builder.injectHead(() => '<script src="a.js"></script>');
      builder.injectHead(() => '<script src="b.js"></script>');
      builder.injectHead(() => '<script src="a.js"></script>');
      expect(builder.collectHead(noCtx)).toEqual([
        '<script src="a.js"></script>',
        '<script src="b.js"></script>',
      ]);
    });

    it("collects body injections", () => {
      builder.injectBody(() => '<div id="chat"></div>');
      expect(builder.collectBody(noCtx)).toEqual(['<div id="chat"></div>']);
    });

    it("returns empty array when no callbacks registered", () => {
      expect(builder.collectHead(noCtx)).toEqual([]);
      expect(builder.collectBody(noCtx)).toEqual([]);
    });

    it("handles array return from callback", () => {
      builder.injectHead(() => ["<meta a>", "<meta b>"]);
      expect(builder.collectHead(noCtx)).toEqual(["<meta a>", "<meta b>"]);
    });

    it("skips non-string items in array with warning", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      builder.injectBody(() => ["<div>", 42, "</div>"] as any);
      expect(builder.collectBody(noCtx)).toEqual(["<div>", "</div>"]);
      expect(warn).toHaveBeenCalledWith(
        "[plugin] injectBody callback returned non-string item (got number), skipping"
      );
      warn.mockRestore();
    });

    it("skips non-string non-array result with warning", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      builder.injectHead(() => 42 as any);
      expect(builder.collectHead(noCtx)).toEqual([]);
      expect(warn).toHaveBeenCalledWith(
        "[plugin] injectHead callback returned unexpected type (got number), expected string or string[], skipping"
      );
      warn.mockRestore();
    });

    it("skips object result with warning", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      builder.injectBody(() => ({}) as any);
      expect(builder.collectBody(noCtx)).toEqual([]);
      expect(warn).toHaveBeenCalledWith(
        "[plugin] injectBody callback returned unexpected type (got object), expected string or string[], skipping"
      );
      warn.mockRestore();
    });

    it("keeps strings in mixed array, skips non-strings", () => {
      builder.injectHead(() => ["<meta a>", 1, "<meta b>", {}, null] as any);
      expect(builder.collectHead(noCtx)).toEqual(["<meta a>", "<meta b>"]);
    });
  });

  describe("collectRemarkPlugins / collectRehypePlugins", () => {
    it("collects remark plugins", () => {
      const plugin1 = {} as Pluggable;
      const plugin2 = {} as Pluggable;
      builder.remarkPlugins(() => [plugin1]);
      builder.remarkPlugins(() => [plugin2]);
      expect(builder.collectRemarkPlugins()).toEqual([plugin1, plugin2]);
    });

    it("collects rehype plugins", () => {
      const plugin = {} as Pluggable;
      builder.rehypePlugins(() => [plugin]);
      expect(builder.collectRehypePlugins()).toEqual([plugin]);
    });

    it("returns empty array when no plugins registered", () => {
      expect(builder.collectRemarkPlugins()).toEqual([]);
      expect(builder.collectRehypePlugins()).toEqual([]);
    });
  });

  describe("runHandleRequest", () => {
    const defaultReq = new Request("http://test.dev");
    const defaultCtx = devCtx();

    it("short-circuits on first Response", async () => {
      const responseA = new Response("A");
      builder.handleRequest(() => responseA);
      builder.handleRequest(() => new Response("B"));
      const result = await builder.runHandleRequest(defaultReq, defaultCtx);
      expect(result).toBe(responseA);
    });

    it("returns null when no handler returns Response", async () => {
      builder.handleRequest(() => {});
      const result = await builder.runHandleRequest(defaultReq, defaultCtx);
      expect(result).toBeNull();
    });

    it("continues to next handler on error", async () => {
      const spy = vi.fn(() => new Response("ok"));
      builder.handleRequest(() => {
        throw new Error("fail");
      });
      builder.handleRequest(spy);
      const result = await builder.runHandleRequest(defaultReq, defaultCtx);
      expect(result).toBeInstanceOf(Response);
      expect(await result!.text()).toBe("ok");
      expect(spy).toHaveBeenCalled();
    });

    it("passes request and context to handler", async () => {
      const spy = vi.fn();
      builder.handleRequest(spy);
      await builder.runHandleRequest(
        new Request("http://test.dev/api"),
        devCtx({ port: 4000, hostname: "0.0.0.0" })
      );
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ url: "http://test.dev/api" }), {
        port: 4000,
        hostname: "0.0.0.0",
      });
    });
  });
});

// ─── HTML Injection Tests ────────────────────────────────

describe("html.ts — headExtra / bodyExtra", () => {
  /** Shell with default opts, replacing body only. */
  function shell(body: string, ...rest: Partial<Parameters<typeof htmlShell>[0]>[]) {
    return htmlShell(htmlOpts(body, ...rest));
  }

  it("renders headExtra inside <head>", () => {
    const html = shell("<p>hello</p>", { headExtra: ['<meta name="test" content="1">'] });
    expect(html).toContain('<meta name="test" content="1">');
    expect(html.indexOf('<meta name="test"')).toBeLessThan(html.indexOf("</head>"));
  });

  it("renders bodyExtra before </body> after script", () => {
    const html = shell("<p>hello</p>", { bodyExtra: ['<div id="chat"></div>'] });
    expect(html).toContain('<div id="chat"></div>');
    const bodyClose = html.indexOf("</body>");
    expect(html.indexOf('<div id="chat"')).toBeLessThan(bodyClose);
    expect(html.indexOf('src="/assets/app.js"')).toBeLessThan(html.indexOf('<div id="chat"'));
  });

  it("produces identical output when headExtra/bodyExtra are empty", () => {
    const withEmpty = shell("<p>hello</p>", { headExtra: [], bodyExtra: [] });
    const without = shell("<p>hello</p>");
    expect(withEmpty).toBe(without);
  });

  it("renders multiple headExtra entries", () => {
    const html = shell("<p>hello</p>", { headExtra: ["<meta a>", "<meta b>", "<meta c>"] });
    expect(html).toContain("<meta a>");
    expect(html).toContain("<meta b>");
    expect(html).toContain("<meta c>");
  });
});

// ─── Full Plugin Lifecycle Integration ───────────────────

describe("Full Plugin Lifecycle", () => {
  let builder: BuildPluginBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it("executes full lifecycle in correct order", async () => {
    const order: string[] = [];

    builder.onStart(() => {
      order.push("onStart");
    });
    builder.onLoad({ filter: /\.mdx$/ }, ({ content }) => {
      order.push("onLoad");
      return { contents: content.toUpperCase() };
    });
    builder.transformFrontmatter((fm) => {
      order.push("transformFrontmatter");
      return { ...fm, processed: true };
    });
    builder.injectHead(() => {
      order.push("injectHead");
      return "";
    });
    builder.injectBody(() => {
      order.push("injectBody");
      return "";
    });
    builder.transformHtml((html) => {
      order.push("transformHtml");
      return html;
    });
    builder.onEnd(() => {
      order.push("onEnd");
    });

    await builder.runOnStart();
    const loadResult = await builder.runOnLoad("page.mdx", "content");
    const fmResult = await builder.runTransformFrontmatterChain(
      {},
      { slug: "page", filePath: "page.mdx", content: "" }
    );
    builder.collectHead(null as any);
    builder.collectBody(null as any);
    await builder.runTransformHtmlChain("<p>test</p>", null as any);
    await builder.runOnEnd([]);

    expect(loadResult?.contents).toBe("CONTENT");
    expect(fmResult).toEqual({ processed: true });

    const idx = (h: string) => order.indexOf(h);
    expect(idx("onStart")).toBeLessThan(idx("onLoad"));
    expect(idx("onLoad")).toBeLessThan(idx("transformFrontmatter"));
    expect(idx("transformFrontmatter")).toBeLessThan(idx("injectHead"));
    expect(idx("injectHead")).toBeLessThan(idx("injectBody"));
    expect(idx("injectBody")).toBeLessThan(idx("transformHtml"));
    expect(idx("transformHtml")).toBeLessThan(idx("onEnd"));
  });
});
