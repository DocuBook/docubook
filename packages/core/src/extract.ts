import matter from "gray-matter";
import type { TocItem } from "./types";

export function sluggify(text: string): string {
    const slug = text.toLowerCase().replace(/\s+/g, "-");
    return slug.replace(/[^a-z0-9-]/g, "");
}

export function extractTocsFromRawMdx(rawMdx: string): TocItem[] {
    // Match code blocks, markdown headings, and <Release version="x.y.z" />.
    const combinedRegex = /(```[\s\S]*?```)|^(#{2,4})\s(.+)$|<Release[^>]*version="([^"]+)"/gm;
    const extractedHeadings: TocItem[] = [];

    let match: RegExpExecArray | null;
    while ((match = combinedRegex.exec(rawMdx)) !== null) {
        if (match[1]) continue;

        if (match[2]) {
            const headingLevel = match[2].length;
            const headingText = match[3].trim();
            extractedHeadings.push({
                level: headingLevel,
                text: headingText,
                href: `#${sluggify(headingText)}`,
            });
            continue;
        }

        if (match[4]) {
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

export function extractFrontmatter<Frontmatter>(content: string): Frontmatter {
    return matter(content).data as Frontmatter;
}
