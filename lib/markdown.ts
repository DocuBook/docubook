import { compileMDX } from "next-mdx-remote/rsc";
import path from "path";
import { promises as fs } from "fs";
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeCodeTitles from "rehype-code-titles";
import { page_routes, ROUTES } from "./routes-config";
import { visit } from "unist-util-visit";
import type { Node } from "unist";
import matter from "gray-matter";

// Type definitions for unist-util-visit
interface Element extends Node {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown> & {
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

// custom components imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Pre from "@/components/markdown/PreMdx";
import Note from "@/components/markdown/NoteMdx";
import { Stepper, StepperItem } from "@/components/markdown/StepperMdx";
import Image from "@/components/markdown/ImageMdx";
import Link from "@/components/markdown/LinkMdx";
import Outlet from "@/components/markdown/OutletMdx";
import Youtube from "@/components/markdown/YoutubeMdx";
import Tooltip from "@/components/markdown/TooltipsMdx";
import Card from "@/components/markdown/CardMdx";
import Button from "@/components/markdown/ButtonMdx";
import Accordion from "@/components/markdown/AccordionMdx";
import CardGroup from "@/components/markdown/CardGroupMdx";
import Kbd from "@/components/markdown/KeyboardMdx";
import { Release, Changes } from "@/components/markdown/ReleaseMdx";
import { File, Files, Folder } from "@/components/markdown/FileTreeMdx";

// add custom components
const components = {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  pre: Pre,
  Note,
  Stepper,
  StepperItem,
  img: Image,
  a: Link,
  Outlet,
  Youtube,
  Tooltip,
  Card,
  Button,
  Accordion,
  CardGroup,
  Kbd,
  // Release Note Components
  Release,
  Changes,
  // File Tree Components
  File,
  Files,
  Folder,
};

// can be used for other pages like blogs, Guides etc
async function parseMdx<Frontmatter>(rawMdx: string) {
  return await compileMDX<Frontmatter>({
    source: rawMdx,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        rehypePlugins: [
          preProcess,
          rehypeCodeTitles,
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

export async function getDocsForSlug(slug: string) {
  try {
    const contentPath = getDocsContentPath(slug);
    const rawMdx = await fs.readFile(contentPath, "utf-8");
    return await parseMdx<BaseMdxFrontmatter>(rawMdx);
  } catch (err) {
    console.log(err);
  }
}

export async function getDocsTocs(slug: string) {
  const contentPath = getDocsContentPath(slug);
  const rawMdx = await fs.readFile(contentPath, "utf-8");
  // captures between ## - #### can modify accordingly
  const headingsRegex = /^(#{2,4})\s(.+)$/gm;
  let match;
  const extractedHeadings = [];
  while ((match = headingsRegex.exec(rawMdx)) !== null) {
    const headingLevel = match[1].length;
    const headingText = match[2].trim();
    const slug = sluggify(headingText);
    extractedHeadings.push({
      level: headingLevel,
      text: headingText,
      href: `#${slug}`,
    });
  }
  return extractedHeadings;
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

function getDocsContentPath(slug: string) {
  return path.join(process.cwd(), "/contents/docs/", `${slug}/index.mdx`);
}

function justGetFrontmatterFromMD<Frontmatter>(rawMd: string): Frontmatter {
  return matter(rawMd).data as Frontmatter;
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
      const totalPath = path.join(
        process.cwd(),
        "/contents/docs/",
        prevHref,
        it.href,
        "index.mdx"
      );
      const raw = await fs.readFile(totalPath, "utf-8");
      return {
        ...justGetFrontmatterFromMD<BaseMdxFrontmatter>(raw),
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
