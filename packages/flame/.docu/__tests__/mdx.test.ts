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

vi.mock("../node/utils", () => ({
  getGitLastModified: vi.fn(() => null),
  getGitLastModifiedBatch: vi.fn(() => new Map()),
}));

// Import after mocks
import { compileMdx } from "../node/mdx";
import type { MdxResult } from "../node/mdx";

describe("compileMdx — plugin merging", () => {
  const sampleMdx = "---\ntitle: Test\n---\n\nHello world";

  beforeEach(() => {
    lastSerializeOptions = null;
  });

  it("uses only defaults when no plugins passed", async () => {
    await compileMdx(sampleMdx, "test.mdx");
    expect(lastSerializeOptions).not.toBeNull();
    expect(lastSerializeOptions!.remarkPlugins).toHaveLength(1);
    expect(lastSerializeOptions!.remarkPlugins![0].name).toBe("defaultRemark");
    expect(lastSerializeOptions!.rehypePlugins).toHaveLength(1);
    expect(lastSerializeOptions!.rehypePlugins![0].name).toBe("defaultRehype");
  });

  it("uses only defaults when empty arrays passed", async () => {
    await compileMdx(sampleMdx, "test.mdx", undefined, [], []);
    expect(lastSerializeOptions!.remarkPlugins).toHaveLength(1);
    expect(lastSerializeOptions!.rehypePlugins).toHaveLength(1);
  });

  it("merges remark plugins after defaults", async () => {
    const extraRemark: Pluggable[] = [{ name: "customRemark" } as any];
    await compileMdx(sampleMdx, "test.mdx", undefined, extraRemark);
    expect(lastSerializeOptions!.remarkPlugins).toHaveLength(2);
    expect(lastSerializeOptions!.remarkPlugins![0].name).toBe("defaultRemark");
    expect(lastSerializeOptions!.remarkPlugins![1].name).toBe("customRemark");
  });

  it("merges rehype plugins after defaults", async () => {
    const extraRehype: Pluggable[] = [{ name: "customRehype" } as any];
    await compileMdx(sampleMdx, "test.mdx", undefined, undefined, extraRehype);
    expect(lastSerializeOptions!.rehypePlugins).toHaveLength(2);
    expect(lastSerializeOptions!.rehypePlugins![0].name).toBe("defaultRehype");
    expect(lastSerializeOptions!.rehypePlugins![1].name).toBe("customRehype");
  });

  it("merges both remark and rehype plugins together", async () => {
    const extraRemark: Pluggable[] = [{ name: "customRemark" } as any];
    const extraRehype: Pluggable[] = [{ name: "customRehype" } as any];
    await compileMdx(sampleMdx, "test.mdx", undefined, extraRemark, extraRehype);
    expect(lastSerializeOptions!.remarkPlugins).toHaveLength(2);
    expect(lastSerializeOptions!.rehypePlugins).toHaveLength(2);
  });

  it("preserves MdxResult shape", async () => {
    const result: MdxResult = await compileMdx(sampleMdx, "test.mdx");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("compiledSource");
    expect(result).toHaveProperty("frontmatter");
    expect(result).toHaveProperty("tocs");
  });
});
