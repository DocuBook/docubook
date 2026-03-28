import path from "path";
import { promises as fs } from "fs";
import { extractFrontmatter, extractTocsFromRawMdx } from "./extract";
import { parseMdx, type ParseMdxOptions } from "./compile";
import type { MdxCompileResult, TocItem } from "./types";

type CacheFn = <T extends (...args: any[]) => any>(fn: T) => T;

export type ReadMdxFileResult = {
    content: string;
    filePath: string;
};

export type ParsedMdxFile<Frontmatter, T extends TocItem = TocItem> = {
    content: string;
    filePath: string;
    frontmatter: Frontmatter;
    tocs: T[];
};

export type CompiledMdxFile<Frontmatter, T extends TocItem = TocItem> = MdxCompileResult<Frontmatter> & {
    filePath: string;
    tocs: T[];
};

type ReadMdxBySlugOptions = {
    rootDir?: string;
    docsDir?: string;
};

export async function readMdxFileBySlug(slug: string, options: ReadMdxBySlugOptions = {}): Promise<ReadMdxFileResult> {
    const docsDir = options.docsDir ?? "docs";
    // Keep file-system path operations ignored by Turbopack tracing.
    // The runtime path is constrained to docsDir and slug candidates below.
    const docsRoot = options.rootDir
        ? path.join(/*turbopackIgnore: true*/ options.rootDir, docsDir)
        : path.join(/*turbopackIgnore: true*/ process.cwd(), docsDir);
    const paths = [
        path.join(/*turbopackIgnore: true*/ docsRoot, `${slug}.mdx`),
        path.join(/*turbopackIgnore: true*/ docsRoot, slug, "index.mdx"),
    ];

    for (const p of paths) {
        try {
            const content = await fs.readFile(/*turbopackIgnore: true*/ p, "utf-8");
            return {
                content,
                filePath: `${docsDir}/${path.relative(/*turbopackIgnore: true*/ docsRoot, p)}`,
            };
        } catch {
            // ignore and try next candidate
        }
    }

    throw new Error(`Could not find mdx file for slug: ${slug}`);
}

type ParseMdxFileOptions<T extends TocItem> = {
    tocsExtractor?: (rawMdx: string) => T[];
};

export function parseMdxFile<Frontmatter, T extends TocItem = TocItem>(
    raw: ReadMdxFileResult,
    options: ParseMdxFileOptions<T> = {}
): ParsedMdxFile<Frontmatter, T> {
    const tocsExtractor = options.tocsExtractor ?? ((mdx) => extractTocsFromRawMdx(mdx) as T[]);

    return {
        content: raw.content,
        filePath: raw.filePath,
        frontmatter: extractFrontmatter<Frontmatter>(raw.content),
        tocs: tocsExtractor(raw.content),
    };
}

export async function compileParsedMdxFile<Frontmatter, T extends TocItem = TocItem>(
    parsed: ParsedMdxFile<Frontmatter, T>,
    options: ParseMdxOptions = {}
): Promise<CompiledMdxFile<Frontmatter, T>> {
    const compiled = await parseMdx<Frontmatter>(parsed.content, options);

    return {
        ...compiled,
        frontmatter: parsed.frontmatter,
        filePath: parsed.filePath,
        tocs: parsed.tocs,
    };
}

export type CreateMdxContentServiceOptions<Frontmatter, T extends TocItem = TocItem> = {
    parseOptions?: ParseMdxOptions;
    readOptions?: ReadMdxBySlugOptions;
    tocsExtractor?: (rawMdx: string) => T[];
    cacheFn?: CacheFn;
};

export function createMdxContentService<Frontmatter, T extends TocItem = TocItem>(
    options: CreateMdxContentServiceOptions<Frontmatter, T> = {}
) {
    const identityCache: CacheFn = (fn) => fn;
    const cacheFn = options.cacheFn ?? identityCache;

    const getParsedForSlug = cacheFn(async (slug: string): Promise<ParsedMdxFile<Frontmatter, T>> => {
        const raw = await readMdxFileBySlug(slug, options.readOptions);
        return parseMdxFile<Frontmatter, T>(raw, { tocsExtractor: options.tocsExtractor });
    });

    const getCompiledForSlug = cacheFn(async (slug: string): Promise<CompiledMdxFile<Frontmatter, T>> => {
        const parsed = await getParsedForSlug(slug);
        return compileParsedMdxFile<Frontmatter, T>(parsed, options.parseOptions);
    });

    async function getFrontmatterForSlug(slug: string): Promise<Frontmatter> {
        const parsed = await getParsedForSlug(slug);
        return parsed.frontmatter;
    }

    async function getTocsForSlug(slug: string): Promise<T[]> {
        const parsed = await getParsedForSlug(slug);
        return parsed.tocs;
    }

    return {
        getParsedForSlug,
        getCompiledForSlug,
        getFrontmatterForSlug,
        getTocsForSlug,
    };
}