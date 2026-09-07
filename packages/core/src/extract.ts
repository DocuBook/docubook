import matter from "@11ty/gray-matter";
import type { ZodType } from "zod";
import type { TocItem } from "./types";
import { compileSync } from "@mdx-js/mdx";
import { createDefaultRemarkPlugins } from "./compile";
import rehypeSlug from "rehype-slug";
import { rehypeCollectTocs } from "./plugins/rehypeCollectTocs";

export function sluggify(text: string): string {
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
  const slug = normalized.toLowerCase().replace(/\s+/g, "-");
  return slug.replace(/[^a-z0-9-]/g, "");
}

export function extractTocsFromRawMdx(rawMdx: string): TocItem[] {
  const tocs: TocItem[] = [];
  compileSync(matter(rawMdx).content, {
    format: "md",
    remarkPlugins: createDefaultRemarkPlugins(),
    rehypePlugins: [rehypeSlug, [rehypeCollectTocs, tocs]],
  });
  return tocs;
}

export function extractFrontmatter<Frontmatter>(content: string): Frontmatter {
  try {
    return matter(content).data as Frontmatter;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to extract frontmatter: ${reason}`, { cause: error });
  }
}

/**
 * Extract frontmatter and return both the parsed data and the content
 * with the frontmatter block stripped. Avoids a second parse during
 * compilation.
 *
 * Optionally validates the parsed frontmatter with a Zod schema.
 * YAML coerces unquoted values (e.g. `date: 2026-06-10` → Date, `3.5` → number),
 * so use `z.coerce.*` for fields that must remain strings.
 */
export function extractFrontmatterWithContent<Frontmatter>(content: string): {
  frontmatter: Frontmatter;
  strippedContent: string;
};
export function extractFrontmatterWithContent<Frontmatter>(
  content: string,
  schema: ZodType<Frontmatter>
): { frontmatter: Frontmatter; strippedContent: string };
export function extractFrontmatterWithContent<Frontmatter>(
  content: string,
  schema?: ZodType<Frontmatter>
): { frontmatter: Frontmatter; strippedContent: string } {
  try {
    const { data, content: strippedContent } = matter(content);
    return {
      frontmatter: schema ? schema.parse(data) : (data as Frontmatter),
      strippedContent,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to extract frontmatter: ${reason}`, { cause: error });
  }
}
