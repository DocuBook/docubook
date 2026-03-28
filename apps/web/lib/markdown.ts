import {
  createMdxContentService,
  extractFrontmatter,
  readMdxFileBySlug,
  type MdxCompileResult as CoreMdxCompileResult,
} from "@docubook/core";
import { cache } from "react";
import path from "path";
import { page_routes, ROUTES } from "./routes";
import type { TocItem } from "./toc";
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

export type MdxCompileResult<Frontmatter> = CoreMdxCompileResult<Frontmatter>;

export type DocsForSlugResult = MdxCompileResult<BaseMdxFrontmatter> & {
  filePath: string;
  tocs: TocItem[];
};

// Shared frontmatter shape used by docs pages.
// Keep this close to exported result types for easier discovery.
export type BaseMdxFrontmatter = {
  title: string;
  description: string;
  image: string;
  date: string;
};

// `React.cache` deduplicates calls within a single server-render pass.
// Keep request-level cache in app layer, while markdown pipeline lives in core.
const docsService = createMdxContentService<BaseMdxFrontmatter, TocItem>({
  parseOptions: { components },
  cacheFn: cache,
});

// Return frontmatter only for a docs slug.
export async function getDocsFrontmatterForSlug(slug: string): Promise<BaseMdxFrontmatter | undefined> {
  try {
    return await docsService.getFrontmatterForSlug(slug);
  } catch (err) {
    console.log(err);
  }
}

/**
 * Get full compiled documentation (public API)
 * Returns: JSX content, frontmatter, TOCs, file path
 */
export async function getDocsForSlug(slug: string): Promise<DocsForSlugResult | undefined> {
  try {
    return await docsService.getCompiledForSlug(slug);
  } catch (err) {
    console.log(err);
  }
}

/**
 * Get only table of contents for a slug
 */
export async function getDocsTocs(slug: string) {
  try {
    return await docsService.getTocsForSlug(slug);
  } catch {
    return [];
  }
}

// Build static params for the docs route segment.
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

// Get previous and next page entries from the route list.
export function getPreviousNext(path: string) {
  const index = page_routes.findIndex(({ href }) => href == `/${path}`);
  return {
    prev: page_routes[index - 1],
    next: page_routes[index + 1],
  };
}

// Collect frontmatter of direct child pages under the given docs path.
export async function getAllChilds(pathString: string) {
  const items = pathString.split("/").filter((it) => it !== "");
  let nestedRoutes = ROUTES;

  // Resolve the nested route branch for the requested path.
  let resolvedHref = "";
  for (const it of items) {
    const found = nestedRoutes.find((innerIt) => innerIt.href == `/${it}`);
    if (!found) break;
    resolvedHref += found.href;
    nestedRoutes = found.items ?? [];
  }
  if (!resolvedHref) return [];

  return await Promise.all(
    nestedRoutes.map(async (it) => {
      const slug = path.join(resolvedHref, it.href);
      const { content } = await readMdxFileBySlug(slug);
      return {
        ...extractFrontmatter<BaseMdxFrontmatter>(content),
        href: `/docs${resolvedHref}${it.href}`,
      };
    })
  );
}
