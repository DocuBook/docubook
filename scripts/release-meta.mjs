#!/usr/bin/env node
/**
 * Builds the Release PR title and version commit message from the pending
 * changesets, for `changesets/action`'s `pr-title` and `commit-message`.
 *
 *   chore: v<version> - <subject>
 *
 *   - @docubook/markdown (minor): <first sentence of its changeset>
 *   - @docubook/flame (patch): <first sentence of its changeset>
 *
 * The version is flame's next version, the product's `v<flame version>` tag.
 * A release without flame uses the highest next version in the linked group.
 * The subject is the first sentence of the changeset with the largest bump,
 * shortened at a word boundary so the header fits commitlint's 100-character
 * limit. The body has one line per changeset, largest bump first.
 *
 * Usage:
 *   node scripts/release-meta.mjs              # appends title/commit to $GITHUB_OUTPUT
 *   node scripts/release-meta.mjs --print      # prints the commit message
 *
 * Read-only: runs `changeset status --output` and never edits the tree. With no
 * pending changesets it falls back to "chore: version packages"; the action
 * then publishes instead of opening a Release PR, and ignores both values.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const cli = path.join(root, "node_modules", "@changesets", "cli", "bin.js");
const PRODUCT = "@docubook/flame";
const FALLBACK = "chore: version packages";
const HEADER_MAX = 100;
const BUMP_RANK = { major: 3, minor: 2, patch: 1, none: 0 };

/** First sentence of a changeset summary, on one line and without the final period. */
export function firstSentence(summary) {
  const text = summary
    .trim()
    .split(/\n\s*\n/)[0]
    .replace(/\s+/g, " ");
  // A sentence ends at ". " before an uppercase letter, a backtick or "(",
  // so "e.g. foo" and version numbers like "12.3.0" do not split it.
  const [sentence] = text.split(/(?<=[.!?])\s+(?=[A-Z`(])/);
  return sentence.replace(/[.!?]$/, "");
}

/** Shortens text at a word boundary so it is at most `max` characters, ellipsis included. */
export function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:-]+$/, "")}…`;
}

const compareVersions = (a, b) => {
  const pa = a.split(/[.-]/).map(Number);
  const pb = b.split(/[.-]/).map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
};

const largestBump = (releases) =>
  Math.max(0, ...releases.map((release) => BUMP_RANK[release.type] ?? 0));

/** Turns `changeset status --output` JSON into `{ title, commit }`. */
export function releaseMeta(status) {
  const releases = (status.releases ?? []).filter((release) => release.type !== "none");
  // `changeset --empty` adds a changeset with no releases and no summary
  const changesets = (status.changesets ?? []).filter((changeset) => changeset.releases.length > 0);
  if (releases.length === 0 || changesets.length === 0) {
    return { title: FALLBACK, commit: FALLBACK };
  }

  const product = releases.find((release) => release.name === PRODUCT);
  const version =
    product?.newVersion ??
    releases
      .map((release) => release.newVersion)
      .sort(compareVersions)
      .at(-1);

  // Largest bump first; ties keep the planner's (alphabetical) changeset order
  const ordered = changesets
    .map((changeset, index) => ({ changeset, index }))
    .sort(
      (a, b) =>
        largestBump(b.changeset.releases) - largestBump(a.changeset.releases) || a.index - b.index
    )
    .map(({ changeset }) => changeset);

  // The largest bump with a summary names the release; a release whose
  // changesets have no summary at all is titled with the version alone
  const sentences = ordered.map((changeset) => firstSentence(changeset.summary));
  const lead = sentences.find(Boolean);
  const prefix = `chore: v${version}`;
  const title = lead ? `${prefix} - ${truncate(lead, HEADER_MAX - prefix.length - 3)}` : prefix;

  const lines = ordered.map((changeset, index) => {
    const packages = changeset.releases
      .map((release) => `${release.name} (${release.type})`)
      .join(", ");
    return sentences[index] ? `- ${packages}: ${sentences[index]}` : `- ${packages}`;
  });

  return { title, commit: `${title}\n\n${lines.join("\n")}` };
}

function readStatus() {
  const scratch = mkdtempSync(path.join(tmpdir(), "docubook-release-meta-"));
  const file = path.join(scratch, "status.json");
  try {
    execFileSync(process.execPath, [cli, "status", `--output=${file}`], {
      cwd: root,
      stdio: ["ignore", "ignore", "inherit"],
    });
    return JSON.parse(readFileSync(file, "utf8"));
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  const { title, commit } = releaseMeta(readStatus());
  if (process.argv.includes("--print")) {
    console.log(commit);
  } else {
    const output = process.env.GITHUB_OUTPUT;
    if (!output) {
      console.error("GITHUB_OUTPUT is not set; use --print to preview");
      process.exit(2);
    }
    const delimiter = `RELEASE_META_${Date.now()}`;
    appendFileSync(output, `title=${title}\ncommit<<${delimiter}\n${commit}\n${delimiter}\n`);
    console.log(commit);
  }
}
