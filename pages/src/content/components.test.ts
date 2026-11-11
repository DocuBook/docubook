import assert from "node:assert/strict";
import { test } from "node:test";
import { specimens } from "./components.ts";

// Every string a specimen renders, except icon names: those belong to the drawing, not to the Markdown.
const texts = (value: unknown, key = ""): string[] =>
  typeof value === "string"
    ? key === "icon"
      ? []
      : [value]
    : Array.isArray(value)
      ? value.flatMap((item) => texts(item))
      : value && typeof value === "object"
        ? Object.entries(value).flatMap(([k, v]) => texts(v, k))
        : [];
const flat = (text: string) => text.replace(/\s+/g, " ");

test("a specimen renders only what its Markdown source says", () => {
  for (const specimen of specimens) {
    for (const text of texts(specimen.render)) {
      assert.ok(
        flat(specimen.source).includes(flat(text)),
        `${specimen.name}: "${text}" is rendered but not in the source`
      );
    }
  }
});
