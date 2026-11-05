import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { firstSentence, releaseMeta, truncate } from "./release-meta.mjs";

const changeset = (id, summary, releases) => ({ id, summary, releases });
const release = (name, type, newVersion) => ({ name, type, newVersion, oldVersion: "2.3.0" });

describe("releaseMeta", () => {
  it("falls back to the plain title without pending changesets", () => {
    assert.deepEqual(releaseMeta({ changesets: [], releases: [] }), {
      title: "chore: version packages",
      commit: "chore: version packages",
    });
  });

  it("uses flame's version and lists one line per changeset, largest bump first", () => {
    const meta = releaseMeta({
      changesets: [
        changeset("a", "The peer range now accepts v11.", [
          { name: "@docubook/flame", type: "patch" },
        ]),
        changeset("b", "Diagrams render with Mermaid 12. They re-flow.", [
          { name: "@docubook/markdown", type: "minor" },
        ]),
      ],
      releases: [
        release("@docubook/flame", "minor", "2.4.0"),
        release("@docubook/markdown", "minor", "2.4.0"),
      ],
    });
    assert.equal(meta.title, "chore: v2.4.0 - Diagrams render with Mermaid 12");
    assert.equal(
      meta.commit,
      "chore: v2.4.0 - Diagrams render with Mermaid 12\n\n" +
        "- @docubook/markdown (minor): Diagrams render with Mermaid 12\n" +
        "- @docubook/flame (patch): The peer range now accepts v11"
    );
  });

  it("uses the highest version when flame is not released", () => {
    const meta = releaseMeta({
      changesets: [
        changeset("a", "Fix the color scale.", [
          { name: "@docubook/themes-colors", type: "patch" },
        ]),
      ],
      releases: [release("@docubook/themes-colors", "patch", "2.3.1")],
    });
    assert.equal(meta.title, "chore: v2.3.1 - Fix the color scale");
  });

  it("skips empty changesets and changesets without a summary", () => {
    const meta = releaseMeta({
      changesets: [
        changeset("empty", "", []),
        changeset("bare", "", [{ name: "@docubook/core", type: "minor" }]),
        changeset("fix", "Fix a thing.", [{ name: "@docubook/flame", type: "patch" }]),
      ],
      releases: [
        release("@docubook/core", "minor", "2.4.0"),
        release("@docubook/flame", "minor", "2.4.0"),
      ],
    });
    assert.equal(
      meta.commit,
      "chore: v2.4.0 - Fix a thing\n\n- @docubook/core (minor)\n- @docubook/flame (patch): Fix a thing"
    );
  });

  it("titles a release with the version alone when no changeset has a summary", () => {
    const meta = releaseMeta({
      changesets: [changeset("bare", "", [{ name: "@docubook/flame", type: "patch" }])],
      releases: [release("@docubook/flame", "patch", "2.3.1")],
    });
    assert.equal(meta.commit, "chore: v2.3.1\n\n- @docubook/flame (patch)");
  });

  it("keeps the header within commitlint's 100 characters", () => {
    const summary = `Flame now ${"rebuilds every page when a sibling package changes ".repeat(4)}end.`;
    const meta = releaseMeta({
      changesets: [changeset("a", summary, [{ name: "@docubook/flame", type: "patch" }])],
      releases: [release("@docubook/flame", "patch", "2.3.1")],
    });
    assert.ok(meta.title.length <= 100, `${meta.title.length} characters`);
    assert.match(meta.title, /\S…$/);
  });
});

describe("firstSentence", () => {
  it("does not split on abbreviations or version numbers", () => {
    assert.equal(
      firstSentence("Supports math (e.g. katex 0.18.10). Second."),
      "Supports math (e.g. katex 0.18.10)"
    );
  });

  it("stops at the first paragraph and joins wrapped lines", () => {
    assert.equal(
      firstSentence("Line one\ncontinues here\n\nNext paragraph."),
      "Line one continues here"
    );
  });
});

describe("truncate", () => {
  it("leaves short text unchanged", () => {
    assert.equal(truncate("short", 10), "short");
  });
});
