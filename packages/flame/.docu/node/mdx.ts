import React from "react";
import type { Pluggable } from "unified";
import { z, type ZodType } from "zod";
import {
  serialize,
  extractTocsFromRawMdx,
  extractFrontmatterWithContent,
  createDefaultRehypePlugins,
  createDefaultRemarkPlugins,
  MDXRemote,
} from "@docubook/core";
import { createMdxComponents } from "@docubook/markdown";
import { getGitLastModified, getGitLastModifiedBatch, getFilesystemMtime } from "./git";

/**
 * Return the value with `.html` appended, or null if the value should be left
 * unchanged.  Rules:
 *  - Must be a string
 *  - Must start with /docs/  (the /docs root index needs no suffix)
 *  - Must not be an external URL, contain a fragment, or already end in .html
 */
function appendHtml(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (/^https?:\/\//.test(value)) return null;
  if (!value.startsWith("/docs/")) return null;
  if (value.includes("#")) return null;
  if (value.endsWith(".html")) return null;
  return `${value}.html`;
}

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

interface MdastNode {
  type: string;
  // MDX JSX nodes carry their props as an attributes array
  attributes?: { type: string; name: string; value: unknown }[];
  children?: MdastNode[];
}

/**
 * Rehype plugin: append `.html` to internal `/docs/` hrefs on HTML `<a>` nodes.
 *
 * This covers standard markdown links: `[text](/docs/page)` → `<a href="…">`.
 * It runs in the HAST (HTML AST) phase, where `<a>` elements are real nodes.
 *
 * Skips: external URLs, anchor-only links, paths that already end in `.html`,
 * and the `/docs` root index (no trailing slash segment).
 */
function rehypeDocsHtmlLinks() {
  return (tree: HastNode) => {
    function walk(node: HastNode): void {
      if (node.type === "element" && node.tagName === "a") {
        const fixed = appendHtml(node.properties?.href);
        if (fixed) node.properties!.href = fixed;
      }
      if (node.children) {
        for (const child of node.children) walk(child);
      }
    }
    walk(tree);
    return tree;
  };
}

/**
 * Remark plugin: append `.html` to internal `/docs/` hrefs on MDX JSX nodes.
 *
 * MDX JSX elements (`<Card href="…">`, `<LinkCard href="…">`, etc.) live in
 * the MDAST as `mdxJsxFlowElement` / `mdxJsxTextElement` nodes.  They are
 * compiled directly to JavaScript by the MDX compiler *before* rehype runs,
 * so a rehype plugin can never see them as `<a>` elements.  This remark plugin
 * intercepts them at the MDAST phase where their `attributes` array is still
 * accessible and mutable.
 *
 * Skips: same rules as `appendHtml` (external URLs, anchors, already `.html`).
 */
function remarkMdxJsxDocsHtmlLinks() {
  return (tree: MdastNode) => {
    function walk(node: MdastNode): void {
      if (
        (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
        node.attributes
      ) {
        for (const attr of node.attributes) {
          if (attr.type === "mdxJsxAttribute" && attr.name === "href") {
            const fixed = appendHtml(attr.value);
            if (fixed) attr.value = fixed;
          }
        }
      }
      if (node.children) {
        for (const child of node.children) walk(child);
      }
    }
    walk(tree);
    return tree;
  };
}

export { getGitLastModifiedBatch };

export interface MdxResult {
  content: React.ReactElement;
  compiledSource: string;
  frontmatter: Frontmatter;
  tocs: ReturnType<typeof extractTocsFromRawMdx>;
}

/**
 * DocuBook frontmatter contract — single source of truth for frontmatter
 * fields. Add new properties here; types and validation derive from it.
 * YAML coerces unquoted values, so string fields use `z.coerce.*`.
 * `.passthrough()` keeps unknown fields (e.g. `author: wildan`, `tags`)
 * in the parsed output — arbitrary frontmatter metadata stays available
 * via `frontmatterField(frontmatter, key)` instead of being silently
 * stripped by Zod's default object parsing.
 */
export const frontmatterSchema = z
  .object({
    title: z.coerce.string().optional(),
    description: z.coerce.string().optional(),
    image: z.coerce.string().optional(),
    date: z.coerce.string().optional(),
  })
  .passthrough();

export type Frontmatter = z.infer<typeof frontmatterSchema>;

/**
 * Read a string field from frontmatter after the plugin transform chain
 * (which widens the type to `Record<string, unknown>`). Returns "" when
 * missing or not a string.
 */
export function frontmatterField(frontmatter: Record<string, unknown>, key: string): string {
  return typeof frontmatter[key] === "string" ? (frontmatter[key] as string) : "";
}

/**
 * Zod schema validating frontmatter after extraction.
 * Must satisfy the frontmatter contract (defaults to `frontmatterSchema`).
 */
export type FrontmatterSchema = ZodType<Frontmatter>;

/**
 * Compile MDX/MD content into a React element and compiled source.
 *
 * @param rawMdx - Raw MDX/MD file content
 * @param filePath - Relative file path for git date lookup
 * @param gitDates - Optional pre-fetched git last-modified map
 * @param remarkPlugins - Additional remark plugins (merged after defaults, optional)
 * @param rehypePlugins - Additional rehype plugins (merged after defaults, optional)
 * @param frontmatterSchema - Custom schema overriding the default contract
 */
/**
 * Shared compile core used by `compileMdx` (SSR) and `compileMdxModule`
 * (static hydration). Strips frontmatter, merges the doc plugin chain
 * (defaults + .html link fixes + user plugins) and runs `serialize()`.
 */
async function serializeWithDocPlugins(
  rawMdx: string,
  opts: {
    outputFormat?: "function-body" | "program";
    remarkPlugins?: Pluggable[];
    rehypePlugins?: Pluggable[];
    frontmatterSchema?: FrontmatterSchema;
  } = {},
  pre?: { frontmatter: Frontmatter; strippedContent: string }
) {
  // Parse-once: when the prePass already extracted the frontmatter + stripped
  // content, reuse it instead of re-parsing (the SSR phase skips extraction).
  const { strippedContent, frontmatter } =
    pre ?? extractFrontmatterWithContent<Frontmatter>(rawMdx, opts.frontmatterSchema);

  const defaultRemark = createDefaultRemarkPlugins();
  const defaultRehype = createDefaultRehypePlugins();

  // remarkMdxJsxDocsHtmlLinks must run before user plugins so custom remark
  // transforms see already-fixed hrefs.  rehypeDocsHtmlLinks handles plain
  // markdown [text](path) → <a> elements in the HAST phase.
  const finalRemark = [...defaultRemark, remarkMdxJsxDocsHtmlLinks, ...(opts.remarkPlugins ?? [])];
  const finalRehype = [...defaultRehype, rehypeDocsHtmlLinks, ...(opts.rehypePlugins ?? [])];

  // v2 contract: plain markdown + directives only — authored JSX tags are
  // not parsed (dropped, content kept as text). Return the frontmatter parsed
  // above — `serialize()` only parses it when `parseFrontmatter` is set.
  return serialize(strippedContent, {
    outputFormat: opts.outputFormat,
    format: "md",
    mdxOptions: {
      rehypePlugins: finalRehype,
      remarkPlugins: finalRemark,
    },
  }).then((serialized) => ({ ...serialized, frontmatter, strippedContent }));
}

/**
 * Compile MDX/MD content into a React element and compiled source.
 *
 * @param rawMdx - Raw MDX/MD file content
 * @param filePath - Relative file path for git date lookup
 * @param gitDates - Optional pre-fetched git last-modified map
 * @param remarkPlugins - Additional remark plugins (merged after defaults, optional)
 * @param rehypePlugins - Additional rehype plugins (merged after defaults, optional)
 * @param frontmatterSchema - Custom schema overriding the default contract
 */
export async function compileMdx(
  rawMdx: string,
  filePath: string,
  gitDates?: Map<string, string>,
  remarkPlugins?: Pluggable[],
  rehypePlugins?: Pluggable[],
  frontmatterSchema?: FrontmatterSchema,
  /** Pre-pass extracted data — avoids re-parsing frontmatter in the SSR phase. */
  pre?: { frontmatter: Frontmatter; strippedContent: string }
): Promise<MdxResult> {
  const tocs = extractTocsFromRawMdx(rawMdx);
  const frontmatter =
    pre?.frontmatter ??
    extractFrontmatterWithContent<Frontmatter>(rawMdx, frontmatterSchema).frontmatter;
  const serialized = await serializeWithDocPlugins(
    rawMdx,
    { remarkPlugins, rehypePlugins, frontmatterSchema },
    pre
  );

  const components = createMdxComponents();
  const content = React.createElement(MDXRemote, {
    compiledSource: serialized.compiledSource,
    scope: {},
    frontmatter: {},
    components,
  });

  const date =
    frontmatter.date ||
    gitDates?.get(filePath) ||
    (await getGitLastModified(filePath)) ||
    (await getFilesystemMtime(filePath)) ||
    undefined;

  return {
    content,
    compiledSource: serialized.compiledSource,
    frontmatter: { ...frontmatter, date },
    tocs,
  };
}

/**
 * Compile MDX to a real ESM module source (program format) for static
 * client-side hydration — the browser imports and executes it via the bundler
 * instead of `new Function(compiledSource)`. Uses the same plugin chain as
 * `compileMdx` so the hydrated tree matches the SSR output.
 */
/**
 * Frontmatter records collected once during compilation — pagination title /
 * description and other metadata consumers read from here instead of
 * re-reading + re-parsing files (parse-once contract: the frontmatter is
 * already parsed by `serializeWithDocPlugins`).
 */
const pageFrontmatter = new Map<string, Frontmatter>();

/** Register a page's frontmatter, keyed by its href. */
export function registerPageFrontmatter(href: string, frontmatter: Frontmatter): void {
  pageFrontmatter.set(href, frontmatter);
}

/** Look up a page's frontmatter (undefined when not yet compiled). */
export function getPageFrontmatter(href: string): Frontmatter | undefined {
  return pageFrontmatter.get(href);
}

/**
 * Frontmatter-stripped content from the prePass — lets the SSR compile
 * phase skip its own `extractFrontmatterWithContent` (parse-once across
 * both compile phases).
 */
const pageStripped = new Map<string, string>();

export function registerPageStripped(href: string, stripped: string): void {
  pageStripped.set(href, stripped);
}

export function getPageStripped(href: string): string | undefined {
  return pageStripped.get(href);
}

/**
 * Original (pre-transform) file content, cached during the prePass so the
 * page loop does not re-read the file from disk — one read per file.
 */
const pageContent = new Map<string, string>();

export function registerPageContent(href: string, raw: string): void {
  pageContent.set(href, raw);
}

export function getPageContent(href: string): string | undefined {
  return pageContent.get(href);
}

export async function compileMdxModule(
  rawMdx: string,
  remarkPlugins?: Pluggable[],
  rehypePlugins?: Pluggable[],
  /** Page href — registers the frontmatter (title/description/image/date)
   * once for pagination and metadata consumers. */
  href?: string
): Promise<string> {
  const serialized = await serializeWithDocPlugins(rawMdx, {
    outputFormat: "program",
    remarkPlugins,
    rehypePlugins,
  });
  if (href) {
    registerPageFrontmatter(href, serialized.frontmatter as Frontmatter);
    registerPageStripped(href, serialized.strippedContent);
  }
  return serialized.compiledSource;
}
