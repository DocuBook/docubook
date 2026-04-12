import {
  createMdxContentService,
  extractFrontmatter,
  readMdxFileBySlug,
  type MdxCompileResult as CoreMdxCompileResult,
} from "@docubook/core";
import { cache } from "react";
import { promises as fsPromises } from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { page_routes, ROUTES } from "./routes";
import type { TocItem } from "./toc";
import { mdxComponents as components } from "./mdx-components";

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
  date?: string | Date;
};

// `React.cache` deduplicates calls within a single server-render pass.
// Keep request-level cache in app layer, while markdown pipeline lives in core.

const fileMtimeCache = new Map<string, Date>();
const fileGitDateCache = new Map<string, Date | undefined>();
let gitRootCache: string | undefined;
const execFileAsync = promisify(execFile);

async function getGitRootDir(): Promise<string | undefined> {
  if (gitRootCache !== undefined) return gitRootCache

  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--show-toplevel"])
    gitRootCache = stdout.trim() || ""
    return gitRootCache || undefined
  } catch {
    gitRootCache = ""
    return undefined
  }
}

async function getFileLastCommitDate(absoluteFilePath: string): Promise<Date | undefined> {
  if (fileGitDateCache.has(absoluteFilePath)) {
    return fileGitDateCache.get(absoluteFilePath)
  }

  try {
    const gitRoot = await getGitRootDir()
    if (!gitRoot) {
      fileGitDateCache.set(absoluteFilePath, undefined)
      return undefined
    }

    const relativePath = path.relative(gitRoot, absoluteFilePath)
    if (relativePath.startsWith("..")) {
      fileGitDateCache.set(absoluteFilePath, undefined)
      return undefined
    }

    const { stdout } = await execFileAsync(
      "git",
      ["log", "-1", "--format=%cI", "--", relativePath],
      { cwd: gitRoot }
    )

    const rawDate = stdout.trim()
    if (!rawDate) {
      fileGitDateCache.set(absoluteFilePath, undefined)
      return undefined
    }

    const parsed = new Date(rawDate)
    if (Number.isNaN(parsed.getTime())) {
      fileGitDateCache.set(absoluteFilePath, undefined)
      return undefined
    }

    fileGitDateCache.set(absoluteFilePath, parsed)
    return parsed
  } catch {
    fileGitDateCache.set(absoluteFilePath, undefined)
    return undefined
  }
}

/**
 * Return the mtime of an MDX file as a Date object.
 * Caller receives the Date directly — no string round-trip, no re-parse needed.
 */
async function getFileLastModifiedDate(absoluteFilePath: string): Promise<Date | undefined> {
  if (fileMtimeCache.has(absoluteFilePath)) {
    return fileMtimeCache.get(absoluteFilePath);
  }
  try {
    const stat = await fsPromises.stat(absoluteFilePath);
    const mtime = stat.mtime;
    fileMtimeCache.set(absoluteFilePath, mtime); // Cache result for future calls
    return mtime;
  } catch {
    return undefined;
  }
}

const docsService = createMdxContentService<BaseMdxFrontmatter, TocItem>({
  parseOptions: { components },
  cacheFn: cache,
  // Backward-compatible: if `date` is absent in frontmatter, fall back to
  // Git commit date first, then filesystem mtime as final fallback.
  frontmatterEnricher: async (frontmatter, absoluteFilePath) => {
    if (!frontmatter.date) {
      const gitDate = await getFileLastCommitDate(absoluteFilePath);
      if (gitDate) return { ...frontmatter, date: gitDate };

      const fileDate = await getFileLastModifiedDate(absoluteFilePath);
      if (fileDate) return { ...frontmatter, date: fileDate };
    }
    return frontmatter;
  },
});

// Return frontmatter only for a docs slug.
export async function getDocsFrontmatterForSlug(
  slug: string
): Promise<BaseMdxFrontmatter | undefined> {
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
