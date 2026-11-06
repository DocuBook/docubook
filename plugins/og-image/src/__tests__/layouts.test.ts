/**
 * Golden images for both layouts. Font rasterisation differs slightly across
 * platforms, so the comparison only runs on Linux x64 (CI) and allows a small
 * share of differing pixels. After an intended layout change, refresh with:
 *
 *   UPDATE_GOLDEN=1 pnpm --filter @docubook/plugin-og-image test
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Renderer } from "@takumi-rs/core";
import type { Card } from "../cards";
import { buildTree, HEIGHT, WIDTH, type Brand } from "../layouts";
import type { Layout } from "../options";
import { createEngine } from "../renderer";

const GOLDEN_DIR = join(import.meta.dirname, "__golden__");
const update = process.env.UPDATE_GOLDEN === "1";
const comparable = process.platform === "linux" && process.arch === "x64";

/** Share of pixels allowed to differ by more than a few levels. */
const MAX_DIFF_RATIO = 0.005;

const LOGO = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#2483e2"/><circle cx="5" cy="5" r="2" fill="#fff"/></svg>'
);

const brand = (fontFamily: string, logo: Uint8Array | undefined): Brand => ({
  siteName: "DocuBook",
  domain: "docubook.pro",
  logo,
  fontFamily,
  palette: {
    background: "0 0% 100%",
    foreground: "220 30% 15%",
    primary: "210 81% 56%",
    muted: "220 15% 38%",
    border: "210 20% 88%",
  },
});

const card: Card = {
  kind: "docs",
  slug: "getting-started/configuration",
  title: "Configuration",
  description: "Complete reference for docu.json — the site configuration file for DocuBook Flame.",
  section: "Getting Started",
};

const longCard: Card = {
  ...card,
  title: "Base Path & Subpaths: serving a documentation site under a nested deployment prefix",
  description:
    "How meta.basePath and meta.baseURL combine to produce canonical and OpenGraph URLs when the site is served from a subdirectory of the host, with worked examples.",
};

async function pixels(png: Uint8Array): Promise<Buffer> {
  return new Renderer().render(
    { type: "image", src: png, style: { width: WIDTH, height: HEIGHT } },
    { width: WIDTH, height: HEIGHT, format: "raw" }
  );
}

async function diffRatio(a: Uint8Array, b: Uint8Array): Promise<number> {
  const [pa, pb] = await Promise.all([pixels(a), pixels(b)]);
  let differing = 0;
  for (let i = 0; i < pa.length; i += 4) {
    if (
      Math.abs(pa[i] - pb[i]) > 8 ||
      Math.abs(pa[i + 1] - pb[i + 1]) > 8 ||
      Math.abs(pa[i + 2] - pb[i + 2]) > 8
    ) {
      differing++;
    }
  }
  return differing / (pa.length / 4);
}

const cases: Array<[string, Layout, Card, boolean]> = [
  ["card", "card", card, true],
  ["card-long", "card", longCard, true],
  ["card-no-logo", "card", card, false],
  ["minimal", "minimal", card, true],
];

describe.skipIf(!comparable && !update)("layout golden images", () => {
  it.each(cases)("%s", async (name, layout, content, withLogo) => {
    const engine = await createEngine([]);
    const png = await engine.render(
      buildTree(layout, content, brand(engine.fontFamily, withLogo ? LOGO : undefined))
    );
    const golden = join(GOLDEN_DIR, `${name}.png`);
    if (update || !existsSync(golden)) {
      await mkdir(GOLDEN_DIR, { recursive: true });
      await writeFile(golden, png);
      return;
    }
    expect(await diffRatio(png, new Uint8Array(await readFile(golden)))).toBeLessThan(
      MAX_DIFF_RATIO
    );
  });
});

describe("layout trees", () => {
  it("keep page text in text nodes", () => {
    const tree = JSON.stringify(
      buildTree("card", { ...card, title: "<b>bold</b>" }, brand('"Geist"', LOGO))
    );
    expect(tree).toContain('"type":"text","text":"<b>bold</b>"');
  });

  it("leave out the description, section, logo and domain when there are none", () => {
    const bare = buildTree(
      "card",
      { ...card, description: "", section: undefined },
      { ...brand('"Geist"', undefined), domain: undefined }
    );
    const json = JSON.stringify(bare);
    expect(json).not.toContain('"type":"image"');
    expect(json).not.toContain("›");
    expect(json).not.toContain("docubook.pro");
  });
});
