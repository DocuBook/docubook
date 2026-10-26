import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ExecCallback = (err: Error | null, stdout: string) => void;
const execFile = vi.fn();

vi.mock("node:child_process", () => ({ execFile }));

const { getGitLastModified, getGitLastModifiedBatch } = await import("../node/git");

/** Make every git spawn fail the way Node's execFile reports it. */
function gitFails(code: number | string, stderr = "") {
  execFile.mockImplementation((_cmd: string, _args: string[], _opts: unknown, cb: ExecCallback) =>
    cb(Object.assign(new Error(`Command failed: git log\n${stderr}`), { code, stderr }), "")
  );
}

function gitOutputs(stdout: string) {
  execFile.mockImplementation((_cmd: string, _args: string[], _opts: unknown, cb: ExecCallback) =>
    cb(null, stdout)
  );
}

const PATHS = ["docs/a.mdx", "docs/b.mdx"];

describe("git last-modified lookup without usable history", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    execFile.mockReset();
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    error = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    error.mockRestore();
  });

  // CI checkouts without .git, a fresh `git init` with no commits, and
  // machines without git all exit this way — dates fall back to mtime.
  it.each([
    [
      "not a git repository",
      128,
      "fatal: not a git repository (or any parent up to mount point /)",
    ],
    [
      "a repository with no commits",
      128,
      "fatal: your current branch 'main' does not have any commits yet",
    ],
    ["git not installed", "ENOENT", ""],
  ])("stays silent for %s", async (_label, code, stderr) => {
    gitFails(code, stderr);

    const dates = await getGitLastModifiedBatch(PATHS);

    expect(dates.size).toBe(0);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("skips per-page git spawns once the batch found no history", async () => {
    gitFails(128, "fatal: not a git repository");
    await getGitLastModifiedBatch(PATHS);
    execFile.mockClear();

    expect(await getGitLastModified("docs/a.mdx")).toBeNull();
    expect(execFile).not.toHaveBeenCalled();
  });

  it("resumes per-page lookups after a batch that had history", async () => {
    gitFails(128, "fatal: not a git repository");
    await getGitLastModifiedBatch(PATHS);
    gitOutputs("2026-01-02T03:04:05+00:00\n\ndocs/a.mdx\n");
    await getGitLastModifiedBatch(PATHS);
    gitOutputs("2026-01-02T03:04:05+00:00\n");

    expect(await getGitLastModified("docs/b.mdx")).toBe("2026-01-02T03:04:05+00:00");
  });

  it("reports an unexpected failure on one line, without the path list or stack", async () => {
    gitFails(1, "error: something unexpected\nmore detail");

    await getGitLastModifiedBatch(PATHS);

    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]).toEqual([
      "[git] last-modified lookup failed, falling back to file mtime: error: something unexpected",
    ]);
  });
});
