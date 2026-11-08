// Build a page-mascot character: two 3x3 source sheets in pages/characters/<name>/ become two
// aligned 1080px webp atlases in pages/public/mascots/. Node port of page-mascot's key.py + build.py
// (MIT, Kamran Ahmed), trimmed to what this site needs.
//
//   node pages/scripts/build-mascot.mjs panda
//
// shortcut: the bottom fade is an alpha ramp without the blurred bands of build.py, upgrade if the cut shoulder line shows.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const pages = join(dirname(fileURLToPath(import.meta.url)), "..");
const name = process.argv[2];
if (!name) throw new Error("usage: node pages/scripts/build-mascot.mjs <name>");
const src = join(pages, "characters", name);
const dest = join(pages, "public", "mascots");
mkdirSync(dest, { recursive: true });

const TILE = 360;
const BODY_BAND = 0.4;
const SCALE_CLAMP = 0.1;
const MATCH_CLAMP = 0.2;
const FIT_BAND = 0.86;
const SETTLE = 26;
const FADE_DEPTH = 0.04; // our sheets draw a complete bust, so only a thin fade is needed
const BOTTOM_ANCHOR = 0.93;

// ---- raster helpers -------------------------------------------------------------------------
const img = (data, width, height) => ({ data, width, height });
const load = async (path) => {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return img(
    new Uint8ClampedArray(data.buffer, data.byteOffset, data.length),
    info.width,
    info.height
  );
};
const toSharp = (im) =>
  sharp(Buffer.from(im.data.buffer, im.data.byteOffset, im.data.length), {
    raw: { width: im.width, height: im.height, channels: 4 },
  });
const blank = (w, h) => img(new Uint8ClampedArray(w * h * 4), w, h);
const crop = (im, x0, y0, w, h) => {
  const out = blank(w, h);
  for (let y = 0; y < h; y++) {
    const sy = y0 + y;
    if (sy < 0 || sy >= im.height) continue;
    for (let x = 0; x < w; x++) {
      const sx = x0 + x;
      if (sx < 0 || sx >= im.width) continue;
      out.data.set(
        im.data.subarray((sy * im.width + sx) * 4, (sy * im.width + sx) * 4 + 4),
        (y * w + x) * 4
      );
    }
  }
  return out;
};
const resize = async (im, w, h) => {
  const { data, info } = await toSharp(im)
    .resize(w, h, { fit: "fill", kernel: "lanczos3" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return img(
    new Uint8ClampedArray(data.buffer, data.byteOffset, data.length),
    info.width,
    info.height
  );
};
// Paste with alpha-over onto a blank canvas (frames never overlap, so plain copy where alpha > 0 is enough).
const paste = (canvas, im, dx, dy) => {
  for (let y = 0; y < im.height; y++) {
    const cy = dy + y;
    if (cy < 0 || cy >= canvas.height) continue;
    for (let x = 0; x < im.width; x++) {
      const cx = dx + x;
      if (cx < 0 || cx >= canvas.width) continue;
      const s = (y * im.width + x) * 4;
      if (im.data[s + 3] === 0) continue;
      canvas.data.set(im.data.subarray(s, s + 4), (cy * canvas.width + cx) * 4);
    }
  }
};
const mask = (im, threshold) => {
  const m = new Uint8Array(im.width * im.height);
  for (let i = 0; i < m.length; i++) m[i] = im.data[i * 4 + 3] > threshold ? 1 : 0;
  return m;
};
// 4-connected component labels; returns {labels, sizes}.
const label = (m, w, h) => {
  const labels = new Int32Array(m.length);
  const sizes = [0];
  const stack = new Int32Array(m.length);
  let next = 1;
  for (let i = 0; i < m.length; i++) {
    if (!m[i] || labels[i]) continue;
    let top = 0;
    stack[top++] = i;
    labels[i] = next;
    let size = 0;
    while (top) {
      const p = stack[--top];
      size++;
      const x = p % w;
      const y = (p / w) | 0;
      for (const q of [x > 0 && p - 1, x < w - 1 && p + 1, y > 0 && p - w, y < h - 1 && p + w]) {
        if (q !== false && m[q] && !labels[q]) {
          labels[q] = next;
          stack[top++] = q;
        }
      }
    }
    sizes.push(size);
    next++;
  }
  return { labels, sizes };
};
const largest = (sizes) => sizes.indexOf(Math.max(...sizes.slice(1)));
const bodyMask = (im, threshold) => {
  const m = mask(im, threshold);
  const { labels, sizes } = label(m, im.width, im.height);
  if (sizes.length < 2) return m;
  const keep = largest(sizes);
  for (let i = 0; i < m.length; i++) m[i] = labels[i] === keep ? 1 : 0;
  return m;
};
const bounds = (m, w, h, y0 = 0, y1 = h) => {
  let x0 = w,
    x1 = -1,
    top = h,
    bottom = -1;
  for (let y = y0; y < y1; y++)
    for (let x = 0; x < w; x++)
      if (m[y * w + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
  return { x0, x1, top, bottom };
};

// ---- key.py: remove a solid saturated background from a sheet without alpha -----------------
const lin = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : t / (3 * (6 / 29) ** 2) + 4 / 29);
const lab = (r, g, b) => {
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = f((0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047);
  const y = f(0.2126729 * R + 0.7151522 * G + 0.072175 * B);
  const z = f((0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
};
const keyOut = (im) => {
  const { data, width: w, height: h } = im;
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 10) transparent++;
  if (transparent / (w * h) > 0.05) return "already has an alpha channel";
  const p = Math.min(40, w >> 2, h >> 2);
  const samples = [];
  for (const [cx, cy] of [
    [0, 0],
    [w - p, 0],
    [0, h - p],
    [w - p, h - p],
  ])
    for (let y = cy; y < cy + p; y++)
      for (let x = cx; x < cx + p; x++)
        samples.push(data.subarray((y * w + x) * 4, (y * w + x) * 4 + 3));
  const median = (k) => samples.map((s) => s[k]).sort((a, b) => a - b)[samples.length >> 1];
  const key = [median(0), median(1), median(2)];
  if (Math.max(...key) - Math.min(...key) < 100)
    throw new Error(
      `background #${key.map((v) => v.toString(16).padStart(2, "0")).join("")} is too neutral to key; redraw on pure green`
    );
  const keyLab = lab(...key);
  const alpha = new Float32Array(w * h);
  const candidate = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const [L, a, b] = lab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    const d = Math.hypot(L - keyLab[0], a - keyLab[1], b - keyLab[2]);
    alpha[i] = Math.min(1, Math.max(0, (d - 6) / 20));
    candidate[i] = alpha[i] < 0.999 ? 1 : 0;
  }
  // Only background connected to the border goes; enclosed key-coloured detail stays.
  const { labels } = label(candidate, w, h);
  const touching = new Set();
  for (let x = 0; x < w; x++) {
    touching.add(labels[x]);
    touching.add(labels[(h - 1) * w + x]);
  }
  for (let y = 0; y < h; y++) {
    touching.add(labels[y * w]);
    touching.add(labels[y * w + w - 1]);
  }
  touching.delete(0);
  let keyed = 0;
  for (let i = 0; i < w * h; i++) {
    if (!candidate[i] || !touching.has(labels[i])) continue;
    const a = alpha[i];
    if (a < 1) {
      const safe = Math.max(a, 0.04);
      for (let k = 0; k < 3; k++)
        data[i * 4 + k] = Math.min(
          255,
          Math.max(0, (data[i * 4 + k] - (1 - safe) * key[k]) / safe)
        );
    }
    data[i * 4 + 3] = Math.round(a * 255);
    if (a < 0.02) keyed++;
  }
  if (keyed / (w * h) < 0.2)
    throw new Error(
      "keying would remove under 20% of the sheet; that colour is not the background"
    );
  return `keyed out #${key.map((v) => v.toString(16).padStart(2, "0")).join("")}, ${Math.round((keyed / (w * h)) * 100)}% transparent`;
};

// ---- build.py --------------------------------------------------------------------------------
const dropBleed = (tile) => {
  const m = mask(tile, 40);
  const { labels, sizes } = label(m, tile.width, tile.height);
  if (sizes.length < 2) return tile;
  const keep = largest(sizes);
  const touching = new Set();
  const w = tile.width,
    h = tile.height;
  for (let x = 0; x < w; x++) for (const y of [0, 1, h - 2, h - 1]) touching.add(labels[y * w + x]);
  for (let y = 0; y < h; y++) for (const x of [0, 1, w - 2, w - 1]) touching.add(labels[y * w + x]);
  touching.delete(0);
  touching.delete(keep);
  for (let i = 0; i < m.length; i++) if (touching.has(labels[i])) tile.data[i * 4 + 3] = 0;
  return tile;
};
const tiles = (im) => {
  const w = Math.floor(im.width / 3);
  const out = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) out.push(dropBleed(crop(im, c * w, r * w, w, w)));
  return { w, out };
};
// Anchor on the lower 40% of the character: pinning the body keeps the mascot planted while the head turns.
const anchorBox = (tile) => {
  const body = bodyMask(tile, 128);
  const all = bounds(body, tile.width, tile.height);
  const band = all.bottom - Math.round((all.bottom - all.top) * BODY_BAND);
  return bounds(body, tile.width, tile.height, band, all.bottom + 1);
};

const run = async () => {
  const sheets = {};
  for (const kind of ["directions", "reactions"]) {
    const im = await load(join(src, `${kind}.png`));
    console.log(`  ${kind}.png ${im.width}x${im.height}: ${keyOut(im)}`);
    sheets[kind] = tiles(im);
  }
  const W = sheets.directions.w;
  const PAD = W >> 1;
  const boxes = sheets.directions.out.map(anchorBox);
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const targetCx = mean(boxes.map((b) => (b.x0 + b.x1) / 2));
  const targetCy = mean(boxes.map((b) => (b.top + b.bottom) / 2));
  const widths = boxes.map((b) => b.x1 - b.x0);
  const targetW = mean(widths);
  const noise = (Math.max(...widths) - Math.min(...widths)) / targetW;
  const clamp = noise > 0.03 ? SCALE_CLAMP : 0.35;
  console.log(
    `  anchor noise ${(noise * 100).toFixed(1)}% -> scale clamp ±${Math.round(clamp * 100)}%`
  );

  const align = async (tile) => {
    const box = anchorBox(tile);
    const scale = Math.min(1 + clamp, Math.max(1 - clamp, targetW / (box.x1 - box.x0)));
    const scaled = await resize(tile, Math.round(W * scale), Math.round(W * scale));
    const canvas = blank(W + 2 * PAD, W * 2 + 2 * PAD);
    paste(
      canvas,
      scaled,
      PAD + Math.round(targetCx - ((box.x0 + box.x1) / 2) * scale),
      PAD + Math.round(targetCy - ((box.top + box.bottom) / 2) * scale)
    );
    return canvas;
  };
  const dirFrames = [];
  for (const t of sheets.directions.out) dirFrames.push(await align(t));
  const reactFrames = [];
  for (const t of sheets.reactions.out) reactFrames.push(await align(t));

  // Cross-sheet fit on the shoulders only (FIT_BAND), quarter resolution, one scale + dy for all reaction frames.
  const CW = dirFrames[0].width,
    CH = dirFrames[0].height;
  const silhouette = (frames) => {
    const acc = new Float32Array((CH >> 2) * (CW >> 2));
    for (const fr of frames) {
      const body = bodyMask(fr, 100);
      const b = bounds(body, CW, CH);
      const cut = b.top + Math.round((b.bottom - b.top) * FIT_BAND);
      for (let y = cut; y <= b.bottom; y += 4)
        for (let x = 0; x < CW; x += 4)
          if (body[y * CW + x]) acc[(y >> 2) * (CW >> 2) + (x >> 2)] += 1 / frames.length;
    }
    return acc;
  };
  const Hm = CH >> 2,
    Wm = CW >> 2;
  const dirMask = silhouette(dirFrames),
    reactMask = silhouette(reactFrames);
  const overlap = (scale, dy) => {
    let inter = 0,
      union = 0;
    const oy = (Hm - Hm * scale) / 2 + dy,
      ox = (Wm - Wm * scale) / 2;
    for (let y = 0; y < Hm; y++)
      for (let x = 0; x < Wm; x++) {
        const sy = Math.round((y - oy) / scale),
          sx = Math.round((x - ox) / scale);
        const r = sy >= 0 && sy < Hm && sx >= 0 && sx < Wm ? reactMask[sy * Wm + sx] : 0;
        const d = dirMask[y * Wm + x];
        inter += Math.min(r, d);
        union += Math.max(r, d);
      }
    return union ? inter / union : 0;
  };
  let best = [0, 1, 0];
  for (let s = 1 - MATCH_CLAMP; s <= 1 + MATCH_CLAMP + 1e-9; s += 0.01)
    for (let dy = -40; dy <= 40; dy++) {
      const o = overlap(s, dy);
      if (o > best[0]) best = [o, s, dy];
    }
  const [score, correction, shiftQ] = best;
  const shift = shiftQ * 4;
  console.log(
    `  cross-sheet fit  scale ${correction.toFixed(3)}  shift ${shift >= 0 ? "+" : ""}${shift}px  overlap ${(score * 100).toFixed(1)}%`
  );

  const match = async (fr) => {
    const scaled = await resize(fr, Math.round(CW * correction), Math.round(CH * correction));
    const canvas = blank(CW, CH);
    paste(
      canvas,
      scaled,
      Math.round((CW - scaled.width) / 2),
      Math.round((CH - scaled.height) / 2) + shift
    );
    return canvas;
  };
  const lowerBand = (fr) => {
    const body = bodyMask(fr, 120);
    const b = bounds(body, CW, CH);
    const start = b.top + Math.round((b.bottom - b.top) * 0.66);
    const band = new Uint8Array(body.length);
    for (let y = start; y <= b.bottom; y++)
      for (let x = 0; x < CW; x++) band[y * CW + x] = body[y * CW + x];
    return band;
  };
  const reference = lowerBand(dirFrames[4]);
  const settle = (fr) => {
    const band = lowerBand(fr);
    let bestDy = 0,
      bestScore = -1;
    for (let dy = -SETTLE; dy <= SETTLE; dy++) {
      let inter = 0,
        union = 0;
      for (let y = 0; y < CH; y++) {
        const sy = y - dy;
        if (sy < 0 || sy >= CH) continue;
        for (let x = 0; x < CW; x++) {
          const a = band[sy * CW + x],
            b = reference[y * CW + x];
          inter += a & b;
          union += a | b;
        }
      }
      const s = inter / Math.max(union, 1);
      if (s > bestScore) {
        bestScore = s;
        bestDy = dy;
      }
    }
    if (!bestDy) return [fr, 0];
    const canvas = blank(CW, CH);
    paste(canvas, fr, 0, bestDy);
    return [canvas, bestDy];
  };
  const settled = [];
  for (const fr of reactFrames) settled.push(settle(await match(fr)));
  console.log(`  per-frame settle  [${settled.map(([, dy]) => dy).join(", ")}]`);
  const frames = [...dirFrames, ...settled.map(([fr]) => fr)];

  // One square crop for every frame, feet on the same line, then a bottom alpha ramp.
  let top = CH,
    left = CW,
    right = -1,
    contentBottom = -1;
  for (const fr of frames) {
    const b = bounds(mask(fr, 0), CW, CH);
    top = Math.min(top, b.top);
    left = Math.min(left, b.x0);
    right = Math.max(right, b.x1);
    contentBottom = Math.max(contentBottom, b.bottom);
  }
  top -= 8;
  const side = Math.max(right - left + 16, Math.round((contentBottom - top) / BOTTOM_ANCHOR));
  const cropLeft = Math.round((left + right) / 2 - side / 2);
  const cropTop = contentBottom - Math.round(BOTTOM_ANCHOR * side);
  const dissolve = async (fr) => {
    const c = crop(fr, cropLeft, cropTop, side, side);
    const b = bounds(mask(c, 40), side, side);
    const depth = FADE_DEPTH * side;
    for (let y = 0; y < side; y++) {
      const t = Math.min(1, Math.max(0, (y - (b.bottom - depth)) / depth));
      const keep = 1 - t * t * (3 - 2 * t);
      if (keep === 1) continue;
      for (let x = 0; x < side; x++)
        c.data[(y * side + x) * 4 + 3] = Math.round(c.data[(y * side + x) * 4 + 3] * keep);
    }
    return resize(c, TILE, TILE);
  };
  for (const [kind, group] of [
    ["directions", frames.slice(0, 9)],
    ["reactions", frames.slice(9)],
  ]) {
    const atlas = blank(TILE * 3, TILE * 3);
    for (let i = 0; i < 9; i++)
      paste(atlas, await dissolve(group[i]), (i % 3) * TILE, Math.floor(i / 3) * TILE);
    const out = join(dest, `${name}-${kind}.webp`);
    await toSharp(atlas).webp({ quality: 92, effort: 6 }).toFile(out);
    console.log(`  ${name}-${kind}.webp  ${Math.round(readFileSync(out).length / 1024)} KB`);
  }
};
run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
