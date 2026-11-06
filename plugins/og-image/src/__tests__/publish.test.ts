import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { publishCards, readManifest, SIZE_WARNING_BYTES, type PublishJob } from "../publish";

/** A minimal PNG header with the given size, padded to `bytes`. */
function fakePng(width = 1200, height = 630, bytes = 64): Uint8Array {
  const png = new Uint8Array(Math.max(bytes, 24));
  png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const view = new DataView(png.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return png;
}

const job = (file: string, renderHash = "r1"): PublishJob => ({
  card: { kind: "docs", slug: file, title: file, description: "", section: undefined },
  file,
  nameHash: "n",
  renderHash,
});

let dir: string;
let cardDir: string;
let manifest: string;
let renders: string[];
const render = async (j: PublishJob) => {
  renders.push(j.file);
  return fakePng();
};

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "og-publish-"));
  cardDir = join(dir, "dist/docs/assets/og");
  manifest = join(dir, "og-image.json");
  renders = [];
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe("publishCards", () => {
  it("renders every card on the first build and records them", async () => {
    const result = await publishCards(
      [job("a.1.png"), job("guide/b.2.png")],
      cardDir,
      manifest,
      render
    );
    expect(result.rendered.sort()).toEqual(["a.1.png", "guide/b.2.png"]);
    expect((await stat(join(cardDir, "guide/b.2.png"))).isFile()).toBe(true);
    expect((await readManifest(manifest)).files).toEqual({
      "a.1.png": "r1",
      "guide/b.2.png": "r1",
    });
  });

  it("writes nothing on a build where nothing changed", async () => {
    await publishCards([job("a.1.png")], cardDir, manifest, render);
    const before = (await stat(join(cardDir, "a.1.png"))).mtimeMs;
    renders = [];
    const result = await publishCards([job("a.1.png")], cardDir, manifest, render);
    expect(result).toMatchObject({ rendered: [], unchanged: ["a.1.png"] });
    expect(renders).toEqual([]);
    expect((await stat(join(cardDir, "a.1.png"))).mtimeMs).toBe(before);
  });

  it("re-renders under the same name when only the pixels' inputs change", async () => {
    await publishCards([job("a.1.png", "r1")], cardDir, manifest, render);
    const result = await publishCards([job("a.1.png", "r2")], cardDir, manifest, render);
    expect(result.rendered).toEqual(["a.1.png"]);
    expect((await readManifest(manifest)).files).toEqual({ "a.1.png": "r2" });
  });

  it("re-renders a card whose file is gone, as after flame build --clean", async () => {
    await publishCards([job("a.1.png")], cardDir, manifest, render);
    await rm(join(dir, "dist"), { recursive: true });
    const result = await publishCards([job("a.1.png")], cardDir, manifest, render);
    expect(result.rendered).toEqual(["a.1.png"]);
  });

  it("removes only files an earlier build wrote", async () => {
    await publishCards([job("a.1.png"), job("old/b.2.png")], cardDir, manifest, render);
    await writeFile(join(cardDir, "mine.png"), "user file");
    const result = await publishCards([job("a.1.png")], cardDir, manifest, render);
    expect(result.removed).toEqual(["old/b.2.png"]);
    await expect(stat(join(cardDir, "old"))).rejects.toThrow();
    expect(await readFile(join(cardDir, "mine.png"), "utf8")).toBe("user file");
  });

  it("never follows a manifest entry out of the card directory", async () => {
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "keep.txt"), "x");
    await writeFile(manifest, JSON.stringify({ version: 1, files: { "../../../keep.txt": "r" } }));
    await publishCards([], cardDir, manifest, render);
    expect(await readFile(join(dir, "keep.txt"), "utf8")).toBe("x");
  });

  it("starts over from an unreadable manifest", async () => {
    await writeFile(manifest, "{ not json");
    const result = await publishCards([job("a.1.png")], cardDir, manifest, render);
    expect(result.rendered).toEqual(["a.1.png"]);
  });

  it("rejects output that is not a 1200×630 PNG", async () => {
    await expect(
      publishCards([job("a.1.png")], cardDir, manifest, async () => fakePng(600, 315))
    ).rejects.toThrow(/600×315, expected 1200×630/);
    await expect(
      publishCards([job("a.1.png")], cardDir, manifest, async () => new Uint8Array(10))
    ).rejects.toThrow(/not a PNG/);
  });

  it("reports cards above the size warning but keeps them", async () => {
    const result = await publishCards([job("a.1.png")], cardDir, manifest, async () =>
      fakePng(1200, 630, SIZE_WARNING_BYTES + 1)
    );
    expect(result.oversized).toEqual([{ file: "a.1.png", bytes: SIZE_WARNING_BYTES + 1 }]);
    expect((await stat(join(cardDir, "a.1.png"))).size).toBe(SIZE_WARNING_BYTES + 1);
  });
});
