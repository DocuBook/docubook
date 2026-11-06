/**
 * The only module that talks to Takumi. `render()` never fetches anything:
 * the logo and fonts arrive as bytes, and Takumi's `prepare()`, which does
 * fetch, is never called.
 */

import type { Node } from "@takumi-rs/core";
import { HEIGHT, WIDTH } from "./layouts";
import { LOG_PREFIX, type FontOption } from "./options";

/** Family name Takumi gives its built-in font. */
export const BUILTIN_FAMILY = "Geist";

export interface LoadedFont extends FontOption {
  data: Uint8Array;
}

export interface Engine {
  /** CSS font-family stack: configured fonts first, then Geist. */
  fontFamily: string;
  /** Render a tree to a 1200×630 PNG. */
  render(tree: Node): Promise<Uint8Array>;
  /** The characters of `chars` that no loaded font can draw. */
  missingGlyphs(chars: Iterable<string>): Promise<string[]>;
}

type TakumiModule = typeof import("@takumi-rs/core");

async function loadTakumi(): Promise<TakumiModule> {
  try {
    return await import("@takumi-rs/core");
  } catch (err) {
    throw new Error(
      `${LOG_PREFIX} could not load the Takumi renderer (@takumi-rs/core). ` +
        `Its native binary is installed per platform: run the install again on the machine that builds the site.\n` +
        `Cause: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
}

/** Width and height from a PNG's IHDR chunk, or `undefined` for anything else. */
export function pngSize(bytes: Uint8Array): { width: number; height: number } | undefined {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || signature.some((b, i) => bytes[i] !== b)) return undefined;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/** A code point no font maps, so Takumi draws its "missing glyph" box. */
const NOTDEF_PROBE = "\u{10FFFD}";

export async function createEngine(fonts: LoadedFont[]): Promise<Engine> {
  const { Renderer } = await loadTakumi();
  const renderer = new Renderer();

  const families: string[] = [];
  for (const font of fonts) {
    const registered = await renderer.registerFont({
      data: font.data,
      ...(font.weight !== undefined && { weight: font.weight }),
      ...(font.style !== undefined && { style: font.style }),
    });
    for (const family of registered) {
      if (!families.includes(family.name)) families.push(family.name);
    }
  }
  const fontFamily = [...families, BUILTIN_FAMILY].map((name) => JSON.stringify(name)).join(", ");

  // A glyph is missing when it renders exactly like the probe's box.
  const glyphCache = new Map<string, boolean>();
  let notdef: Buffer | undefined;
  const drawGlyph = (char: string) =>
    renderer.render(
      {
        type: "container",
        style: { display: "flex", width: 48, height: 48, backgroundColor: "#fff", fontFamily },
        children: [{ type: "text", text: char, style: { fontSize: 32, color: "#000" } }],
      },
      { width: 48, height: 48, format: "raw" }
    );

  return {
    fontFamily,
    async render(tree) {
      const png = await renderer.render(tree, { width: WIDTH, height: HEIGHT, format: "png" });
      return new Uint8Array(png.buffer, png.byteOffset, png.byteLength);
    },
    async missingGlyphs(chars) {
      const missing: string[] = [];
      for (const char of chars) {
        // ASCII is covered by every font worth loading; whitespace draws nothing.
        if (char.codePointAt(0)! < 0x7f || /\s/u.test(char)) continue;
        let isMissing = glyphCache.get(char);
        if (isMissing === undefined) {
          notdef ??= await drawGlyph(NOTDEF_PROBE);
          isMissing = notdef.equals(await drawGlyph(char));
          glyphCache.set(char, isMissing);
        }
        if (isMissing) missing.push(char);
      }
      return missing;
    },
  };
}
