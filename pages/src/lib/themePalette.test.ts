import assert from "node:assert/strict";
import { test } from "node:test";
import { palette } from "./themePalette.ts";

test("generates the full palette from one primary hex", () => {
  const p = palette("#FF5733");
  assert.equal(p.variables, 24);
  assert.equal(p.light.length, 23); // every variable but the radius
  assert.equal(p.dark.length, 23);
  assert.equal(p.syntax.length, 12);
  assert.deepEqual(
    p.light.find((s) => s.name === "--primary"),
    { name: "--primary", color: "hsl(11 100% 60%)" }
  );
  assert.match(p.light.find((s) => s.name === "--base-100")!.color, /^oklch\(/);
  // A different hex gives a different palette.
  assert.notEqual(palette("#3B82F6").light[6].color, p.light[6].color);
});
