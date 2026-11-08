import assert from "node:assert/strict";
import { test } from "node:test";
import { parseInline, parseMarkdown } from "./miniMarkdown.ts";

test("frontmatter, heading, paragraph, callout", () => {
  const doc = parseMarkdown(
    [
      "---",
      "title: Intro",
      "description: A: b",
      "---",
      "",
      "## Why",
      "",
      "It is **not** a [runtime](/r).",
      "Second line.",
      "",
      ':::info{title="Contribute"}',
      "  Visit our repo.",
      ":::",
      "After.",
    ].join("\n")
  );
  assert.deepEqual(doc.frontmatter, { title: "Intro", description: "A: b" });
  assert.deepEqual(doc.blocks[0], { type: "heading", text: "Why" });
  assert.deepEqual(doc.blocks[1], {
    type: "paragraph",
    inlines: [
      { type: "text", text: "It is " },
      { type: "strong", text: "not" },
      { type: "text", text: " a " },
      { type: "link", text: "runtime", href: "/r" },
      { type: "text", text: ". Second line." },
    ],
  });
  assert.deepEqual(doc.blocks[2], {
    type: "callout",
    name: "info",
    title: "Contribute",
    inlines: [{ type: "text", text: "Visit our repo." }],
  });
  assert.deepEqual(doc.blocks[3], {
    type: "paragraph",
    inlines: [{ type: "text", text: "After." }],
  });
});

test("partial input while typing degrades gracefully", () => {
  assert.deepEqual(parseMarkdown("---\ntitle: In").frontmatter, { title: "In" });
  assert.deepEqual(parseMarkdown("---\ntitle: In\n---\n\n## Wh").blocks, [
    { type: "heading", text: "Wh" },
  ]);
  assert.deepEqual(parseInline("it is **not a run"), [{ type: "text", text: "it is **not a run" }]);
  assert.deepEqual(parseInline("see [GitHub](/g"), [{ type: "text", text: "see [GitHub](/g" }]);
  const open = parseMarkdown(':::info{title="Contri');
  assert.deepEqual(open.blocks, [{ type: "callout", name: "info", title: "Contri", inlines: [] }]);
  assert.deepEqual(parseMarkdown(":::in").blocks[0].type, "callout");
});
