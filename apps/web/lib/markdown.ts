import { cache } from "react";
import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactNode } from "react";
import path from "path";
import { promises as fs } from "fs";
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeCodeTitles from "rehype-code-titles";
import { page_routes, ROUTES } from "./routes";
import { visit } from "unist-util-visit";
import type { Node, Parent } from "unist";
import type { TocItem } from "./toc";
import matter from "gray-matter";

// Type definitions for unist-util-visit
interface Element extends Node {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown> & {
    className?: string[];
    raw?: string;
  };
  children?: Node[];
  value?: string;
  raw?: string; // For internal use in processing
}

interface TextNode extends Node {
  type: 'text';
  value: string;
}

import dynamic from "next/dynamic"; // custom components - dynamically imported to reduce initial bundle
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell } from "@/components/ui/table";
import Pre from "@/components/markdown/PreMdx";
import Link from "@/components/markdown/LinkMdx";
import Image from "@/components/markdown/ImageMdx";

// Lazy load heavy interactive components
const Note = dynamic(() => import("@/components/markdown/NoteMdx"));
const Stepper = dynamic(() => import("@/components/markdown/StepperMdx").then(m => ({ default: m.Stepper })));
const StepperItem = dynamic(() => import("@/components/markdown/StepperMdx").then(m => ({ default: m.StepperItem })));
const Outlet = dynamic(() => import("@/components/markdown/OutletMdx"));
const Youtube = dynamic(() => import("@/components/markdown/YoutubeMdx"));
const Tooltip = dynamic(() => import("@/components/markdown/TooltipsMdx"));
const Card = dynamic(() => import("@/components/markdown/CardMdx"));
const Button = dynamic(() => import("@/components/markdown/ButtonMdx"));
const Accordion = dynamic(() => import("@/components/markdown/AccordionMdx"));
const CardGroup = dynamic(() => import("@/components/markdown/CardGroupMdx"));
const Kbd = dynamic(() => import("@/components/markdown/KeyboardMdx"));
const Release = dynamic(() => import("@/components/markdown/ReleaseMdx").then(m => ({ default: m.Release })));
const Changes = dynamic(() => import("@/components/markdown/ReleaseMdx").then(m => ({ default: m.Changes })));
const File = dynamic(() => import("@/components/markdown/FileTreeMdx").then(m => ({ default: m.File })));
const Files = dynamic(() => import("@/components/markdown/FileTreeMdx").then(m => ({ default: m.Files })));
const Folder = dynamic(() => import("@/components/markdown/FileTreeMdx").then(m => ({ default: m.Folder })));
const AccordionGroup = dynamic(() => import("@/components/markdown/AccordionGroupMdx"));

// add custom components
const components = {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Youtube,
  Tooltip,
  Card,
  Button,
  Accordion,
  AccordionGroup,
  CardGroup,
  Kbd,
  // Table Components
  table: Table,
  thead: TableHeader,
  tbody: TableBody,
  tfoot: TableFooter,
  tr: TableRow,
  th: TableHead,
  td: TableCell,
  // Release Note Components
  Release,
  Changes,
  // File Tree Components
  File,
  Files,
  Folder,
  pre: Pre,
  Note,
  Stepper,
  StepperItem,
  img: Image,
  a: Link,
  Outlet,
};

export type MdxCompileResult<Frontmatter> = {
  content: ReactNode;
  frontmatter: Frontmatter;
  scope?: Record<string, unknown>;
};

export type DocsForSlugResult = MdxCompileResult<BaseMdxFrontmatter> & {
  filePath: string;
  tocs: TocItem[];
};

type DocsRawResult = {
  content: string;
  filePath: string;
  frontmatter: BaseMdxFrontmatter;
  tocs: TocItem[];
};

// `React.cache` deduplicates calls within a single server-render pass.
// Layer 1: Parse markdown file (read + extract frontmatter/tocs)
// Layer 2: Compile MDX (expensive rehype/remark processing)
const parseMarkdownFileCached = cache(parseMarkdownFile);
const compileMarkdownToCached = cache(compileMarkdownTo);

function extractTocsFromRawMdx(rawMdx: string) {
  // Regex to match code blocks (```...```), standard markdown headings (##), and <Release> tags
  const combinedRegex = /(```[\s\S]*?```)|^(#{2,4})\s(.+)$|<Release[^>]*version="([^"]+)"/gm;

  let match;
  const extractedHeadings: TocItem[] = [];

  while ((match = combinedRegex.exec(rawMdx)) !== null) {
    // match[1] -> Code block content (ignore)
    if (match[1]) continue;

    // match[2] & match[3] -> Markdown headings
    if (match[2]) {
      const headingLevel = match[2].length;
      const headingText = match[3].trim();
      const slug = sluggify(headingText);
      extractedHeadings.push({
        level: headingLevel,
        text: headingText,
        href: `#${slug}`,
      });
    }
    // match[4] -> Release component version
    else if (match[4]) {
      const version = match[4];
      extractedHeadings.push({
        level: 2,
        text: `v${version}`,
        href: `#${version}`,
      });
    }
  }

  return extractedHeadings;
}

// helper function to handle rehype code titles, since by default we can't inject into the className of rehype-code-titles
const handleCodeTitles = () => (tree: Node) => {
  visit(tree, "element", (node: Element, index: number | null, parent: Parent | null) => {
    // Ensure the visited node is valid
    if (!parent || index === null || node.tagName !== 'div') {
      return;
    }

    // Check if this is the title div from rehype-code-titles
    const isTitleDiv = node.properties?.className?.includes('rehype-code-title');
    if (!isTitleDiv) {
      return;
    }

    // Find the next <pre> element, skipping over other nodes like whitespace text
    let nextElement = null;
    for (let i = index + 1; i < parent.children.length; i++) {
      const sibling = parent.children[i];
      if (sibling.type === 'element') {
        nextElement = sibling as Element;
        break;
      }
    }

    // If the next element is a <pre>, move the title to it
    if (nextElement && nextElement.tagName === 'pre') {
      const titleNode = node.children?.[0] as TextNode;
      if (titleNode && titleNode.type === 'text') {
        if (!nextElement.properties) {
          nextElement.properties = {};
        }
        nextElement.properties['data-title'] = titleNode.value;

        // Remove the original title div
        parent.children.splice(index, 1);

        // Return the same index to continue visiting from the correct position
        return index;
      }
    }
  });
};

// can be used for other pages like blogs, Guides etc
async function parseMdx<Frontmatter>(rawMdx: string): Promise<MdxCompileResult<Frontmatter>> {
  return await compileMDX<Frontmatter>({
    source: rawMdx,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        rehypePlugins: [
          preProcess,
          rehypeCodeTitles,
          handleCodeTitles,
          rehypePrism,
          rehypeSlug,
          rehypeAutolinkHeadings,
          postProcess,
        ],
        remarkPlugins: [remarkGfm],
      },
    },
    components,
  });
}

// logic for docs
export type BaseMdxFrontmatter = {
  title: string;
  description: string;
  image: string;
  date: string;
};

export async function getDocsFrontmatterForSlug(slug: string): Promise<BaseMdxFrontmatter | undefined> {
  try {
    const parsed = await parseMarkdownFileCached(slug);
    return parsed.frontmatter;
  } catch (err) {
    console.log(err);
  }
}

/**
 * Parse markdown file: read file system, extract frontmatter and TOCs
 * Does NOT compile MDX (expensive operation)
 */
async function parseMarkdownFile(slug: string): Promise<DocsRawResult> {
  const { content, filePath } = await readMarkdownFile(slug);
  const frontmatter = extractFrontmatter<BaseMdxFrontmatter>(content);
  const tocs = extractTocsFromRawMdx(content);

  return {
    content,
    filePath,
    frontmatter,
    tocs,
  };
}

/**
 * Compile markdown to JSX: parse into MDX with rehype/remark plugins
 * Assumes markdown file is already parsed
 */
async function compileMarkdownTo(slug: string): Promise<DocsForSlugResult> {
  const parsed = await parseMarkdownFileCached(slug);
  const compiled = await parseMdx<BaseMdxFrontmatter>(parsed.content);

  return {
    ...compiled,
    frontmatter: parsed.frontmatter,
    filePath: parsed.filePath,
    tocs: parsed.tocs,
  };
}

/**
 * Get full compiled documentation (public API)
 * Returns: JSX content, frontmatter, TOCs, file path
 */
export async function getDocsForSlug(slug: string): Promise<DocsForSlugResult | undefined> {
  try {
    return await compileMarkdownToCached(slug);
  } catch (err) {
    console.log(err);
  }
}

/**
 * Get only table of contents for a slug
 */
export async function getDocsTocs(slug: string) {
  try {
    const parsed = await parseMarkdownFileCached(slug);
    return parsed.tocs;
  } catch {
    return [];
  }
}

export function getDocsStaticParams() {
  // Ensure the root docs page (docs/index.mdx) is statically generated at /docs.
  // This page is not part of the generated docs tree routes by default.
  // Filter out routes marked as noLink (parent categories that don't have their own page)
  return [
    { slug: [] },
    ...page_routes
      .map((page) => ({
        slug: page.href.split("/").filter(Boolean),
      }))
      .filter(({ slug }) => slug.length > 0), // Exclude empty slugs
  ];
}

export function getPreviousNext(path: string) {
  const index = page_routes.findIndex(({ href }) => href == `/${path}`);
  return {
    prev: page_routes[index - 1],
    next: page_routes[index + 1],
  };
}

function sluggify(text: string) {
  const slug = text.toLowerCase().replace(/\s+/g, "-");
  return slug.replace(/[^a-z0-9-]/g, "");
}

/**
 * Read markdown file from disk
 * Returns: raw content and resolved file path
 */
async function readMarkdownFile(slug: string) {
  const commonPath = path.join(/*turbopackIgnore: true*/ process.cwd(), "docs");
  const paths = [
    path.join(commonPath, `${slug}.mdx`),
    path.join(commonPath, slug, "index.mdx"),
  ];

  for (const p of paths) {
    try {
      const content = await fs.readFile(/*turbopackIgnore: true*/ p, "utf-8");
      return {
        content,
        filePath: `docs/${path.relative(commonPath, p)}`,
      };
    } catch {
      // ignore and try next
    }
  }

  throw new Error(`Could not find mdx file for slug: ${slug}`);
}

/**
 * Extract frontmatter from markdown content
 * Pure function: no side effects
 */
function extractFrontmatter<Frontmatter>(content: string): Frontmatter {
  return matter(content).data as Frontmatter;
}

export async function getAllChilds(pathString: string) {
  const items = pathString.split("/").filter((it) => it !== "");
  let page_routes_copy = ROUTES;

  let prevHref = "";
  for (const it of items) {
    const found = page_routes_copy.find((innerIt) => innerIt.href == `/${it}`);
    if (!found) break;
    prevHref += found.href;
    page_routes_copy = found.items ?? [];
  }
  if (!prevHref) return [];

  return await Promise.all(
    page_routes_copy.map(async (it) => {
      const slug = path.join(prevHref, it.href);
      const { content } = await readMarkdownFile(slug);
      return {
        ...extractFrontmatter<BaseMdxFrontmatter>(content),
        href: `/docs${prevHref}${it.href}`,
      };
    })
  );
}

// for copying the code in pre
const preProcess = () => (tree: Node) => {
  visit(tree, (node: Node) => {
    const element = node as Element;
    if (element?.type === "element" && element?.tagName === "pre" && element.children) {
      const [codeEl] = element.children as Element[];
      if (codeEl.tagName !== "code" || !codeEl.children?.[0]) return;

      const textNode = codeEl.children[0] as TextNode;
      if (textNode.type === 'text' && textNode.value) {
        element.raw = textNode.value;
      }
    }
  });
};

const postProcess = () => (tree: Node) => {
  visit(tree, "element", (node: Node) => {
    const element = node as Element;
    if (element?.type === "element" && element?.tagName === "pre") {
      if (element.properties && element.raw) {
        element.properties.raw = element.raw;
      }
    }
  });
};
