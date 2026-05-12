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
import docuConfig from "../../docu.json" with { type: "json" };

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

function parseFrontmatter(raw: string): { frontmatter: Frontmatter; content: string } {
  if (!raw.startsWith("---")) return { frontmatter: {}, content: raw };
  const end = raw.indexOf("---", 3);
  if (end < 0) return { frontmatter: {}, content: raw };

  const fm: Frontmatter = {};
  const lines = raw.slice(3, end).trim().split("\n");
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      if (key === "title" || key === "description") {
        fm[key] = value.trim();
      }
    }
  }
  return { frontmatter: fm, content: raw.slice(end + 3) };
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

function extractRecords(filePath: string, raw: string): SearchRecord[] {
  const { frontmatter, content } = parseFrontmatter(raw);
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

  const lines = content.split("\n");
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

    if (trimmed.startsWith("import ") || trimmed.startsWith("export ") || trimmed.startsWith("<"))
      continue;

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
      files.push({ path: relPath.replace(/\.(mdx|md)$/, ""), absPath: fullPath });
    }
  }
  return files;
}

export async function generateSearchIndex(docsDir?: string, outputDir?: string): Promise<number> {
  const docs = resolve(docsDir || "./docs");
  const dist = resolve(outputDir || "./.docu/dist/assets");
  await mkdir(dist, { recursive: true });

  const mdxFiles = await scanMdxFiles(docs);
  const allRecords: SearchRecord[] = [];

  for (const file of mdxFiles) {
    const raw = await readFile(file.absPath, "utf-8");
    const records = extractRecords(file.path, raw);
    allRecords.push(...records);
  }

  await writeFile(join(dist, "search-index.json"), JSON.stringify(allRecords));
  return allRecords.length;
}
