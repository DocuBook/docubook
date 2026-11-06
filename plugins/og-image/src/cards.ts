/**
 * Turning a page into a card: what text it shows, whether it is skipped, and
 * the file name it is published under. Pure functions over frontmatter.
 */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "@11ty/gray-matter";
import type { DocuConfig } from "@docubook/flame";
import type { ResolvedOptions } from "./options";
import { CARD_DIR, sectionFor, type Site } from "./site";

export type CardKind = "docs" | "index" | "home";

export interface Card {
  kind: CardKind;
  /** Docs slug; `""` for the docs index and the landing page. */
  slug: string;
  title: string;
  description: string;
  /** Top-level sidebar group, docs pages only. */
  section: string | undefined;
}

export interface PlannedCard {
  card: Card;
  /** File name below `assets/og/`, e.g. `guide/routing.1a2b3c4d.png`. */
  file: string;
  /** Hash of everything flame's page cache also sees; its first 8 chars name the file. */
  nameHash: string;
}

export type SkipReason = "disabled" | "author-image" | "opt-out";

/** Frontmatter value as flame's schema coerces it: primitives become strings. */
function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function overrides(frontmatter: Record<string, unknown>): Record<string, unknown> {
  const og = frontmatter.og;
  return typeof og === "object" && og !== null && !Array.isArray(og)
    ? (og as Record<string, unknown>)
    : {};
}

/**
 * Why a page gets no card, or `undefined` when it gets one. An image the
 * author set always wins; `og: false` opts the page out.
 */
export function skipReason(
  kind: CardKind,
  frontmatter: Record<string, unknown>,
  options: ResolvedOptions
): SkipReason | undefined {
  if (!options.pages[kind]) return "disabled";
  if (frontmatter.og === false) return "opt-out";
  if (text(frontmatter.image)) return "author-image";
  return undefined;
}

/** Card text for a docs page or the docs index. Mirrors flame's title fallback. */
export function docsCard(
  kind: "docs" | "index",
  slug: string,
  frontmatter: Record<string, unknown>,
  site: Site
): Card {
  const og = overrides(frontmatter);
  return {
    kind,
    slug,
    title: text(og.title) || text(frontmatter.title) || slug || "Docs",
    description: text(og.description) || text(frontmatter.description),
    section: kind === "docs" ? sectionFor(site.routes, slug) : undefined,
  };
}

/** Card text for the landing page: the hero headline and the site description. */
export function homeCard(config: DocuConfig): Card {
  const hero = (config as { home?: { hero?: { headline?: unknown } } }).home?.hero;
  return {
    kind: "home",
    slug: "",
    title: text(hero?.headline) || text(config.meta?.title) || "Docs",
    description: text(config.meta?.description),
    section: undefined,
  };
}

export function sha256(...parts: Array<string | Uint8Array>): string {
  const hash = createHash("sha256");
  for (const part of parts) hash.update(part);
  return hash.digest("hex");
}

/**
 * Plan a card's file. The name hash covers only inputs that also invalidate
 * flame's page cache (plugin version, `docu.json`, the page's source), so a
 * page served from that cache always points at a file this build writes.
 */
export function planCard(
  card: Card,
  site: Site,
  options: ResolvedOptions,
  version: string
): PlannedCard {
  const nameHash = sha256(
    JSON.stringify([
      version,
      options.layout,
      options.logo ?? null,
      options.fonts,
      site.siteName,
      site.domain ?? null,
      card.kind,
      card.title,
      card.description,
      card.section ?? null,
    ])
  );
  const stem = card.kind === "docs" ? card.slug : card.kind;
  return { card, file: `${stem}.${nameHash.slice(0, 8)}.png`, nameHash };
}

/** The value set as `frontmatter.image`; flame resolves it against the docs prefix. */
export function imageRef(file: string): string {
  return `./${CARD_DIR}/${file}`;
}

/** Source file candidates for a slug, in the order flame's scanner would find them. */
export function sourceCandidates(docsDir: string, slug: string): string[] {
  if (slug === "") return [join(docsDir, "index.mdx"), join(docsDir, "index.md")];
  return [
    join(docsDir, `${slug}.mdx`),
    join(docsDir, `${slug}.md`),
    join(docsDir, slug, "index.mdx"),
    join(docsDir, slug, "index.md"),
  ];
}

/**
 * Frontmatter of a docs page read from its source file, or `undefined` when
 * no source exists. Parsed with the same library `@docubook/core` uses.
 */
export async function readFrontmatter(
  docsDir: string,
  slug: string
): Promise<Record<string, unknown> | undefined> {
  for (const file of sourceCandidates(docsDir, slug)) {
    let raw: string;
    try {
      raw = await readFile(file, "utf8");
    } catch {
      continue;
    }
    // An options object keeps gray-matter from caching every file's content.
    return matter(raw, {}).data as Record<string, unknown>;
  }
  return undefined;
}
