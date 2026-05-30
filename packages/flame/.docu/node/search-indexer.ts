/**
 * Search Index Generator
 *
 * Scans MDX files at build-time and produces a search-index.json
 * with hierarchy-based records (similar to Algolia DocSearch crawler).
 *
 * Hierarchy levels:
 *   lvl0 = section (parent route title)
 *   lvl1 = page title (frontmatter title or h1)
 *   lvl2-lvl6 = headings h2-h6
 *   content = first paragraph/list items after each heading
 */

import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { extractFrontmatterWithContent } from "@docubook/core";
import { DOCS_DIR, ASSETS_DIR, loadDocuConfig } from "./paths";

const docuConfig = loadDocuConfig();

export interface SearchRecord {
  url: string;
  hierarchy: {
    lvl0: string;
    lvl1: string | null;
    lvl2: string | null;
    lvl3: string | null;
    lvl4: string | null;
    lvl5: string | null;
    lvl6: string | null;
  };
  content: string | null;
  type: "lvl0" | "lvl1" | "lvl2" | "lvl3" | "lvl4" | "lvl5" | "lvl6" | "content";
}

interface Frontmatter {
  title?: string;
  description?: string;
}

function getSectionTitle(filePath: string): string {
  const parts = filePath.split("/");
  if (parts.length > 1) {
    const section = docuConfig.routes?.find(
      (r) => r.href === `/${parts[0]}` || r.href === parts[0]
    );
    if (section) return section.title;
  }
  return docuConfig.meta?.title || "Docs";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripJsx(content: string): string {
  let result = content;
  let prev = "";
  while (result !== prev) {
    prev = result;
    result = result
      .replace(/<[A-Z][\w.]*[\s\S]*?\/>/g, "")
      .replace(/<[A-Z][\w.]*[\s\S]*?>([\s\S]*?)<\/[A-Z][\w.]*>/g, "$1");
  }
  return result;
}

function extractRecords(filePath: string, raw: string): SearchRecord[] {
  const { frontmatter, strippedContent: content } = extractFrontmatterWithContent<Frontmatter>(raw);
  const records: SearchRecord[] = [];
  const url = `/docs/${filePath}`;
  const lvl0 = getSectionTitle(filePath);
  const lvl1 = frontmatter.title || null;

  const hierarchy = {
    lvl0,
    lvl1,
    lvl2: null as string | null,
    lvl3: null as string | null,
    lvl4: null as string | null,
    lvl5: null as string | null,
    lvl6: null as string | null,
  };

  if (lvl1) {
    records.push({
      url,
      hierarchy: { ...hierarchy },
      content: frontmatter.description || null,
      type: "lvl1",
    });
  }

  const plainContent = stripJsx(content);
  const lines = plainContent.split("\n");
  let currentParagraph: string[] = [];
  let inCodeBlock = false;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(" ").trim();
      if (text) {
        records.push({
          url: buildAnchorUrl(),
          hierarchy: { ...hierarchy },
          content: text,
          type: "content",
        });
      }
      currentParagraph = [];
    }
  };

  const buildAnchorUrl = () => {
    for (let i = 6; i >= 2; i--) {
      const key = `lvl${i}` as keyof typeof hierarchy;
      if (hierarchy[key]) return `${url}#${slugify(hierarchy[key]!)}`;
    }
    return url;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (/^import\s+[\w{*]/.test(trimmed) || /^export\s+[\w{*]/.test(trimmed)) continue;

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      const title = headingMatch[2].replace(/[*`[\]]/g, "").trim();

      for (let i = level; i <= 6; i++) {
        (hierarchy as Record<string, string | null>)[`lvl${i}`] = null;
      }
      hierarchy[`lvl${level}` as keyof typeof hierarchy] = title;

      if (level === 1 && !hierarchy.lvl1) {
        hierarchy.lvl1 = title;
      }

      if (level >= 2) {
        records.push({
          url: `${url}#${slugify(title)}`,
          hierarchy: { ...hierarchy },
          content: null,
          type: `lvl${level}` as SearchRecord["type"],
        });
      }
      continue;
    }

    if (trimmed === "" || trimmed === "---") {
      flushParagraph();
      continue;
    }

    if (/^\|.+\|/.test(trimmed)) continue;

    const cleaned = trimmed
      .replace(/^[-*+]\s+/, "") // list markers
      .replace(/^\d+\.\s+/, "") // ordered list
      .replace(/^>\s+/, "") // blockquote
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    if (cleaned) currentParagraph.push(cleaned);
  }

  flushParagraph();
  return records;
}

async function scanMdxFiles(dir: string, base = ""): Promise<{ path: string; absPath: string }[]> {
  const files: { path: string; absPath: string }[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (entry.name === "assets" || entry.name.startsWith(".")) continue;
      files.push(...(await scanMdxFiles(fullPath, relPath)));
    } else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
      if (entry.name === "index.mdx" && !base) continue;
      let path = relPath.replace(/\.(mdx|md)$/, "");
      if (/\/index$/.test(path)) {
        path = path.replace(/\/index$/, "");
      }
      files.push({ path, absPath: fullPath });
    }
  }
  return files;
}

export async function generateSearchIndex(docsDir?: string, outputDir?: string): Promise<number> {
  const docs = resolve(docsDir || DOCS_DIR);
  const dist = resolve(outputDir || ASSETS_DIR);
  await mkdir(dist, { recursive: true });

  const mdxFiles = await scanMdxFiles(docs);
  const results = await Promise.all(
    mdxFiles.map(async (file) => {
      const raw = await readFile(file.absPath, "utf-8");
      return extractRecords(file.path, raw);
    })
  );
  const allRecords = results.flat();

  await writeFile(join(dist, "search-index.json"), JSON.stringify(allRecords));
  return allRecords.length;
}
