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
    extractTocsFromRawMdx: () => [],
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

vi.mock("@docubook/mdx-content", () => ({
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

describe("compileMdx — plugin merging", () => {
  const sampleMdx = "---\ntitle: Test\n---\n\nHello world";

  beforeEach(() => {
    lastSerializeOptions = null;
  });

  it("uses only defaults and built-ins when no plugins passed", async () => {
    await compileMdx(sampleMdx, "test.mdx");
    expect(lastSerializeOptions).not.toBeNull();
    expect(lastSerializeOptions!.remarkPlugins).toHaveLength(2);
    expect(lastSerializeOptions!.remarkPlugins![0].name).toBe("defaultRemark");
    expect(lastSerializeOptions!.remarkPlugins![1].name).toBe("remarkMdxJsxDocsHtmlLinks");
    expect(lastSerializeOptions!.rehypePlugins).toHaveLength(2);
    expect(lastSerializeOptions!.rehypePlugins![0].name).toBe("defaultRehype");
    expect(lastSerializeOptions!.rehypePlugins![1].name).toBe("rehypeDocsHtmlLinks");
  });

  it("uses only defaults and built-ins when empty arrays passed", async () => {
    await compileMdx(sampleMdx, "test.mdx", undefined, [], []);
    expect(lastSerializeOptions!.remarkPlugins).toHaveLength(2);
    expect(lastSerializeOptions!.rehypePlugins).toHaveLength(2);
  });

  it("merges remark plugins after defaults and built-ins", async () => {
    const extraRemark: Pluggable[] = [{ name: "customRemark" } as any];
    await compileMdx(sampleMdx, "test.mdx", undefined, extraRemark);
    expect(lastSerializeOptions!.remarkPlugins).toHaveLength(3);
    expect(lastSerializeOptions!.remarkPlugins![0].name).toBe("defaultRemark");
    expect(lastSerializeOptions!.remarkPlugins![1].name).toBe("remarkMdxJsxDocsHtmlLinks");
    expect(lastSerializeOptions!.remarkPlugins![2].name).toBe("customRemark");
  });

  it("merges rehype plugins after defaults and built-ins", async () => {
    const extraRehype: Pluggable[] = [{ name: "customRehype" } as any];
    await compileMdx(sampleMdx, "test.mdx", undefined, undefined, extraRehype);
    expect(lastSerializeOptions!.rehypePlugins).toHaveLength(3);
    expect(lastSerializeOptions!.rehypePlugins![0].name).toBe("defaultRehype");
    expect(lastSerializeOptions!.rehypePlugins![1].name).toBe("rehypeDocsHtmlLinks");
    expect(lastSerializeOptions!.rehypePlugins![2].name).toBe("customRehype");
  });

  it("merges both remark and rehype plugins together", async () => {
    const extraRemark: Pluggable[] = [{ name: "customRemark" } as any];
    const extraRehype: Pluggable[] = [{ name: "customRehype" } as any];
    await compileMdx(sampleMdx, "test.mdx", undefined, extraRemark, extraRehype);
    expect(lastSerializeOptions!.remarkPlugins).toHaveLength(3);
    expect(lastSerializeOptions!.rehypePlugins).toHaveLength(3);
  });

  it("preserves MdxResult shape", async () => {
    const result: MdxResult = await compileMdx(sampleMdx, "test.mdx");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("compiledSource");
    expect(result).toHaveProperty("frontmatter");
    expect(result).toHaveProperty("tocs");
  });
});
