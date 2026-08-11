import matter from "@11ty/gray-matter";
import type { ZodType } from "zod";
import type { TocItem } from "./types";

const FENCE_MARKER_REGEX = /^(````|```)(?!`)/;
const HEADING_REGEX = /^(#{2,4})\s+(.+)$/;

export function sluggify(text: string): string {
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
  const slug = normalized.toLowerCase().replace(/\s+/g, "-");
  return slug.replace(/[^a-z0-9-]/g, "");
}

export function extractTocsFromRawMdx(rawMdx: string): TocItem[] {
  const extractedHeadings: TocItem[] = [];

  const lines = rawMdx.split(/\r?\n/);
  let inFence = false;
  let fenceLength = 0;

  for (const line of lines) {
    const trimmed = line.trimStart();

    const fenceMatch = FENCE_MARKER_REGEX.exec(trimmed);
    if (fenceMatch) {
      const marker = fenceMatch[1];

      if (!inFence) {
        inFence = true;
        fenceLength = marker.length;
      } else if (marker.length === fenceLength) {
        inFence = false;
      }

      continue;
    }

    if (inFence) {
      continue;
    }

    const headingMatch = HEADING_REGEX.exec(trimmed);
    if (headingMatch) {
      const headingLevel = headingMatch[1].length;
      const headingText = headingMatch[2].trim().replace(/\s+#+\s*$/, "");
      extractedHeadings.push({
        level: headingLevel,
        text: headingText,
        href: `#${sluggify(headingText)}`,
      });
      continue;
    }
  }

  return extractedHeadings;
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
