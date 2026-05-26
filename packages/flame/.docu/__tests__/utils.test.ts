import { describe, it, expect, vi, afterEach } from "vitest";
import { getGitLastModifiedBatch } from "../node/utils";

describe("getGitLastModifiedBatch", () => {
  afterEach(() => {
    vi.mocked(Bun.spawn).mockReset();
  });

  function mockSpawnOutput(stdout: string) {
    vi.mocked(Bun.spawn).mockReturnValue({
      stdout: new Response(stdout).body!,
    } as ReturnType<typeof Bun.spawn>);
  }

  it("returns empty map for empty input", async () => {
    const result = await getGitLastModifiedBatch([]);
    expect(result).toEqual(new Map());
  });

  it("parses git log output with dates and filenames", async () => {
    mockSpawnOutput(
      "2024-05-20T10:00:00+07:00\n\ndocs/intro.mdx\n\n2024-05-19T09:00:00+07:00\n\ndocs/guide.mdx\n"
    );

    const result = await getGitLastModifiedBatch(["docs/intro.mdx", "docs/guide.mdx"]);
    expect(result.get("docs/intro.mdx")).toBe("2024-05-20T10:00:00+07:00");
    expect(result.get("docs/guide.mdx")).toBe("2024-05-19T09:00:00+07:00");
  });

  it("keeps first (most recent) date for duplicate files", async () => {
    mockSpawnOutput(
      "2024-05-20T10:00:00+07:00\n\ndocs/intro.mdx\n\n2024-05-18T08:00:00+07:00\n\ndocs/intro.mdx\n"
    );

    const result = await getGitLastModifiedBatch(["docs/intro.mdx"]);
    expect(result.get("docs/intro.mdx")).toBe("2024-05-20T10:00:00+07:00");
  });

  it("returns empty map when spawn throws", async () => {
    vi.mocked(Bun.spawn).mockImplementation(() => {
      throw new Error("git not found");
    });

    const result = await getGitLastModifiedBatch(["docs/intro.mdx"]);
    expect(result).toEqual(new Map());
  });
});
