import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { serialize, createDefaultRehypePlugins, createDefaultRemarkPlugins } from "@docubook/core";
import { createMdxComponents, type MdxComponentMap } from "@docubook/mdx-content";
import type { ParsedDoc } from "./types";

const DOCS_DIR = resolve("./docs");

export type { MdxComponentMap } from "@docubook/mdx-content";

interface DocsServiceOptions {
  docsDir?: string;
  components?: MdxComponentMap;
}

/**
 * Simple parsed doc interface for native template
 * Uses next-mdx-remote serialize output
 */
export interface ParsedDoc {
  compiledSource: string;
  frontmatter: Record<string, unknown>;
  raw: string;
  scope: Record<string, unknown>;
}

/**
 * Create MDX docs service for native template
 * Uses next-mdx-remote serialize for static compilation
 */
export function createDocsService(options: DocsServiceOptions = {}) {
  const docsDir = options.docsDir || DOCS_DIR;
  const components = options.components || createMdxComponents();

  // Create default plugins
  const rehypePlugins = createDefaultRehypePlugins();
  const remarkPlugins = createDefaultRemarkPlugins();

  /**
   * Read MDX file by path
   */
  async function readMdxFile(pathName: string): Promise<string | null> {
    const patterns = [
      join(docsDir, pathName, "index.mdx"),
      join(docsDir, `${pathName}.mdx`),
    ];
    for (const pattern of patterns) {
      if (existsSync(pattern)) {
        return readFile(pattern, "utf-8");
      }
    }
    return null;
  }

  /**
   * Parse MDX to serialized result
   */
  async function parseMdxFile(raw: string): Promise<ParsedDoc> {
    // Extract frontmatter manually
    let content = raw;
    let frontmatter: Record<string, unknown> = {};

    if (raw.startsWith("---")) {
      const end = raw.indexOf("---", 3);
      if (end > 0) {
        const fmStr = raw.slice(3, end);
        frontmatter = parseFrontmatterSimple(fmStr);
        content = raw.slice(end + 3);
      }
    }

    // Serialize MDX using next-mdx-remote (non-RSC)
    const result = await serialize<Record<string, unknown>>(content, {
      mdxOptions: {
        rehypePlugins,
        remarkPlugins,
        parseFrontmatter: false,
      },
      scope: {},
    });

    return {
      compiledSource: result.compiledSource,
      frontmatter,
      raw,
      scope: result.scope,
    };
  }

  /**
   * Get compiled doc for a path
   */
  async function getDocForPath(pathName: string): Promise<ParsedDoc | null> {
    const raw = await readMdxFile(pathName);
    if (!raw) return null;
    return parseMdxFile(raw);
  }

  return {
    readMdxFile,
    parseMdxFile,
    getDocForPath,
    components,
  };
}

/**
 * Parse frontmatter from string (simple key: value format)
 */
function parseFrontmatterSimple(fmStr: string): Record<string, unknown> {
  const frontmatter: Record<string, unknown> = {};
  const lines = fmStr.trim().split("\n");

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      frontmatter[key] = value.trim();
    }
  }

  return frontmatter;
}

export const docsService = createDocsService();
export { createMdxComponents } from "@docubook/mdx-content";