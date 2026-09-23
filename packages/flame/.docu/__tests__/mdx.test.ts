import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Pluggable } from "unified";

// ─── Capture serialize calls ─────────────────────────────

let lastSerializeOptions: {
  rehypePlugins?: Pluggable[];
  remarkPlugins?: Pluggable[];
} | null = null;

// ─── Mock @docubook/core ───────────────────────────────────

vi.mock("@docubook/core", () => {
  const defaultRemarkPlugins: Pluggable[] = [{ name: "defaultRemark" } as any];
  const defaultRehypePlugins: Pluggable[] = [{ name: "defaultRehype" } as any];

  return {
    createDefaultRemarkPlugins: () => [...defaultRemarkPlugins],
    createDefaultRehypePlugins: () => [...defaultRehypePlugins],
    rehypeCollectTocs: () => () => {},
    extractFrontmatterWithContent: <T>() => ({
      frontmatter: {} as unknown as T,
      strippedContent: "<p>test</p>",
    }),
    serialize: async (
      _content: string,
      opts?: { mdxOptions?: { rehypePlugins?: Pluggable[]; remarkPlugins?: Pluggable[] } }
    ) => {
      lastSerializeOptions = {
        remarkPlugins: opts?.mdxOptions?.remarkPlugins,
        rehypePlugins: opts?.mdxOptions?.rehypePlugins,
      };
      return { compiledSource: "/* compiled */" };
    },
    MDXRemote: vi.fn(() => null),
  };
});

vi.mock("@docubook/markdown", () => ({
  createMdxComponents: () => ({}),
}));

vi.mock("../node/git", () => ({
  getGitLastModified: vi.fn(() => null),
  getGitLastModifiedBatch: vi.fn(() => new Map()),
  getFilesystemMtime: vi.fn(() => "2026-01-01T00:00:00.000Z"),
}));

// Import after mocks
import { compileMdx } from "../node/mdx";
import type { MdxResult } from "../node/mdx";

/** Plugin entries are normalized as `{ name, ... }` objects by compileMdx. */
function pluginName(plugin: Pluggable): string | undefined {
  return (plugin as { name?: string }).name;
}

describe("compileMdx — plugin merging", () => {
  const sampleMdx = "---\ntitle: Test\n---\n\nHello world";

  beforeEach(() => {
    lastSerializeOptions = null;
  });

  it("uses only defaults and built-ins when no plugins passed", async () => {
    await compileMdx(sampleMdx, "test.mdx");
    expect(lastSerializeOptions).not.toBeNull();
    expect(lastSerializeOptions!.remarkPlugins).toHaveLength(2);
    expect(pluginName(lastSerializeOptions!.remarkPlugins![0])).toBe("defaultRemark");
    expect(pluginName(lastSerializeOptions!.remarkPlugins![1])).toBe("remarkMdxJsxDocsHtmlLinks");
    expect(lastSerializeOptions!.rehypePlugins).toHaveLength(3);
    expect(pluginName(lastSerializeOptions!.rehypePlugins![0])).toBe("defaultRehype");
    expect(pluginName(lastSerializeOptions!.rehypePlugins![1])).toBe("rehypeDocsHtmlLinks");
  });

  it("uses only defaults and built-ins when empty arrays passed", async () => {
    await compileMdx(sampleMdx, "test.mdx", undefined, [], []);
    expect(lastSerializeOptions!.remarkPlugins).toHaveLength(2);
    expect(lastSerializeOptions!.rehypePlugins).toHaveLength(3);
  });

  it("merges remark plugins after defaults and built-ins", async () => {
    const extraRemark: Pluggable[] = [{ name: "customRemark" } as any];
    await compileMdx(sampleMdx, "test.mdx", undefined, extraRemark);
    expect(lastSerializeOptions!.remarkPlugins).toHaveLength(3);
    expect(pluginName(lastSerializeOptions!.remarkPlugins![0])).toBe("defaultRemark");
    expect(pluginName(lastSerializeOptions!.remarkPlugins![1])).toBe("remarkMdxJsxDocsHtmlLinks");
    expect(pluginName(lastSerializeOptions!.remarkPlugins![2])).toBe("customRemark");
  });

  it("merges rehype plugins after defaults and built-ins", async () => {
    const extraRehype: Pluggable[] = [{ name: "customRehype" } as any];
    await compileMdx(sampleMdx, "test.mdx", undefined, undefined, extraRehype);
    expect(lastSerializeOptions!.rehypePlugins).toHaveLength(4);
    expect(pluginName(lastSerializeOptions!.rehypePlugins![0])).toBe("defaultRehype");
    expect(pluginName(lastSerializeOptions!.rehypePlugins![1])).toBe("rehypeDocsHtmlLinks");
    expect(pluginName(lastSerializeOptions!.rehypePlugins![2])).toBe("customRehype");
  });

  it("merges both remark and rehype plugins together", async () => {
    const extraRemark: Pluggable[] = [{ name: "customRemark" } as any];
    const extraRehype: Pluggable[] = [{ name: "customRehype" } as any];
    await compileMdx(sampleMdx, "test.mdx", undefined, extraRemark, extraRehype);
    expect(lastSerializeOptions!.remarkPlugins).toHaveLength(3);
    expect(lastSerializeOptions!.rehypePlugins).toHaveLength(4);
  });

  it("preserves MdxResult shape", async () => {
    const result: MdxResult = await compileMdx(sampleMdx, "test.mdx");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("compiledSource");
    expect(result).toHaveProperty("frontmatter");
    expect(result).toHaveProperty("tocs");
  });
});
