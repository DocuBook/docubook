import path from "path";
import { promises as fs } from "fs";
import { extractFrontmatter, extractFrontmatterWithContent, extractTocsFromRawMdx } from "./extract";
import { parseMdx, type ParseMdxOptions } from "./compile";
import type { MdxCompileResult, TocItem } from "./types";

type CacheFn = <T extends (...args: any[]) => any>(fn: T) => T;

export type ReadMdxFileResult = {
    content: string;
    /** Relative path used for UI links (e.g. "docs/getting-started/index.mdx"). */
    filePath: string;
    /** Absolute path on disk — available when file was read by readMdxFileBySlug. */
    absoluteFilePath?: string;
};

export type ParsedMdxFile<Frontmatter, T extends TocItem = TocItem> = {
    /** Raw content with frontmatter block stripped — ready to pass to compileMDX. */
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

    // Resolve once for path-traversal guard — all candidate paths must stay
    // inside docsRoot. This prevents "../../etc/passwd" style slugs from
    // escaping the docs directory, especially important with dynamicParams=true.
    const resolvedRoot = path.resolve(/*turbopackIgnore: true*/ docsRoot);

    const paths = [
        path.join(/*turbopackIgnore: true*/ docsRoot, `${slug}.mdx`),
        path.join(/*turbopackIgnore: true*/ docsRoot, slug, "index.mdx"),
    ];

    for (const p of paths) {
        // Guard: reject any path that escapes the docs root.
        const resolvedP = path.resolve(/*turbopackIgnore: true*/ p);
        if (!resolvedP.startsWith(resolvedRoot + path.sep) && resolvedP !== resolvedRoot) {
            continue;
        }

        try {
            const content = await fs.readFile(/*turbopackIgnore: true*/ p, "utf-8");
            return {
                content,
                filePath: `${docsDir}/${path.relative(/*turbopackIgnore: true*/ docsRoot, p)}`,
                absoluteFilePath: p,
            };
        } catch {
            // ignore and try next candidate
        }
    }

    throw new Error("Could not find mdx file for the requested slug.");
}

type ParseMdxFileOptions<T extends TocItem> = {
    tocsExtractor?: (rawMdx: string) => T[];
};

export function parseMdxFile<Frontmatter, T extends TocItem = TocItem>(
    raw: ReadMdxFileResult,
    options: ParseMdxFileOptions<T> = {}
): ParsedMdxFile<Frontmatter, T> {
    const tocsExtractor = options.tocsExtractor ?? ((mdx) => extractTocsFromRawMdx(mdx) as T[]);
    // Extract frontmatter and stripped content in one gray-matter call.
    // strippedContent is passed to compileMDX so it doesn't need to re-parse frontmatter.
    const { frontmatter, strippedContent } = extractFrontmatterWithContent<Frontmatter>(raw.content);

    return {
        content: strippedContent,
        filePath: raw.filePath,
        frontmatter,
        tocs: tocsExtractor(raw.content),
    };
}

export async function compileParsedMdxFile<Frontmatter, T extends TocItem = TocItem>(
    parsed: ParsedMdxFile<Frontmatter, T>,
    options: ParseMdxOptions = {}
): Promise<CompiledMdxFile<Frontmatter, T>> {
    // Content in parsed is already stripped of frontmatter by parseMdxFile.
    // Set parseFrontmatter:false — no re-parse needed, avoids double work.
    const compiled = await parseMdx<Frontmatter>(parsed.content, { ...options, parseFrontmatter: false });

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
    /**
     * Optional hook to enrich or transform frontmatter after parsing.
     * Called with the parsed frontmatter and the absolute file path.
     * Runs at build time during static generation — ideal for injecting
     * fallback values (e.g. git last-modified date when `date` is absent).
     */
    frontmatterEnricher?: (frontmatter: Frontmatter, absoluteFilePath: string) => Frontmatter | Promise<Frontmatter>;
};

export function createMdxContentService<Frontmatter, T extends TocItem = TocItem>(
    options: CreateMdxContentServiceOptions<Frontmatter, T> = {}
) {
    const identityCache: CacheFn = (fn) => fn;
    const cacheFn = options.cacheFn ?? identityCache;

    const getParsedForSlug = cacheFn(async (slug: string): Promise<ParsedMdxFile<Frontmatter, T>> => {
        const raw = await readMdxFileBySlug(slug, options.readOptions);
        const parsed = parseMdxFile<Frontmatter, T>(raw, { tocsExtractor: options.tocsExtractor });
        if (options.frontmatterEnricher && raw.absoluteFilePath) {
            parsed.frontmatter = await options.frontmatterEnricher(parsed.frontmatter, raw.absoluteFilePath);
        }
        return parsed;
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