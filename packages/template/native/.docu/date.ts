import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { parseDate, formatDate2 } from "./utils";

const DOCS_DIR = resolve("./docs");

export interface DateOptions {
    filePath: string;
    frontmatterDate?: string;
    showPrefix?: boolean;
}

export async function getDocDate({
    filePath,
    frontmatterDate,
    showPrefix = true,
}: DateOptions): Promise<string | null> {
    if (frontmatterDate) {
        const date = parseDate(frontmatterDate);
        return showPrefix
            ? `Last updated ${formatDate2(date)}`
            : formatDate2(date);
    }

    const fullPath = resolve(DOCS_DIR, filePath);

    try {
        const stats = await fs.stat(fullPath);
        const lastModified = stats.mtime;

        return showPrefix
            ? `Last updated ${formatDate2(lastModified)}`
            : formatDate2(lastModified);
    } catch {
        return null;
    }
}

export function parseFrontmatterDate(mdxContent: string): string | undefined {
    if (!mdxContent.startsWith("---")) {
        return undefined;
    }

    const end = mdxContent.indexOf("---", 3);
    if (end === -1) {
        return undefined;
    }

    const frontmatter = mdxContent.slice(3, end).trim();

    for (const line of frontmatter.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("date:")) {
            const value = trimmed.slice(5).trim();
            return value.replace(/^["']|["']$/g, "");
        }
    }

    return undefined;
}