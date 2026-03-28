import { compileMDX } from "next-mdx-remote/rsc";
import type { Node, Parent } from "unist";
import { visit } from "unist-util-visit";
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeCodeTitles from "rehype-code-titles";
import type { MdxCompileResult } from "./types";

interface Element extends Node {
    type: string;
    tagName?: string;
    properties?: Record<string, unknown> & {
        className?: string[];
        raw?: string;
    };
    children?: Node[];
    raw?: string;
}

interface TextNode extends Node {
    type: "text";
    value: string;
}

type CompileMdxInput = Parameters<typeof compileMDX<Record<string, unknown>>>[0];
type CompileMdxOptions = NonNullable<CompileMdxInput["options"]>;
type CompilerMdxOptions = NonNullable<CompileMdxOptions["mdxOptions"]>;

export type ParseMdxOptions = {
    components?: CompileMdxInput["components"];
    rehypePlugins?: CompilerMdxOptions["rehypePlugins"];
    remarkPlugins?: CompilerMdxOptions["remarkPlugins"];
};

export const handleCodeTitles = () => (tree: Node) => {
    visit(tree, "element", (node: Element, index: number | null, parent: Parent | null) => {
        if (!parent || index === null || node.tagName !== "div") {
            return;
        }

        const isTitleDiv = node.properties?.className?.includes("rehype-code-title");
        if (!isTitleDiv) {
            return;
        }

        let nextElement: Element | null = null;
        for (let i = index + 1; i < parent.children.length; i++) {
            const sibling = parent.children[i];
            if (sibling.type === "element") {
                nextElement = sibling as Element;
                break;
            }
        }

        if (nextElement?.tagName === "pre") {
            const titleNode = node.children?.[0] as TextNode;
            if (titleNode?.type === "text") {
                if (!nextElement.properties) {
                    nextElement.properties = {};
                }
                nextElement.properties["data-title"] = titleNode.value;
                parent.children.splice(index, 1);
                return index;
            }
        }
    });
};

export const preProcess = () => (tree: Node) => {
    visit(tree, (node: Node) => {
        const element = node as Element;
        if (element?.type === "element" && element?.tagName === "pre" && element.children) {
            const [codeEl] = element.children as Element[];
            if (codeEl.tagName !== "code" || !codeEl.children?.[0]) return;

            const textNode = codeEl.children[0] as TextNode;
            if (textNode.type === "text" && textNode.value) {
                element.raw = textNode.value;
            }
        }
    });
};

export const postProcess = () => (tree: Node) => {
    visit(tree, "element", (node: Node) => {
        const element = node as Element;
        if (element?.type === "element" && element?.tagName === "pre") {
            if (element.properties && element.raw) {
                element.properties.raw = element.raw;
            }
        }
    });
};

export function createDefaultRehypePlugins(): unknown[] {
    return [
        preProcess,
        rehypeCodeTitles,
        handleCodeTitles,
        rehypePrism,
        rehypeSlug,
        rehypeAutolinkHeadings,
        postProcess,
    ];
}

export function createDefaultRemarkPlugins(): unknown[] {
    return [remarkGfm];
}

export async function parseMdx<Frontmatter>(
    rawMdx: string,
    options: ParseMdxOptions = {}
): Promise<MdxCompileResult<Frontmatter>> {
    const rehypePlugins = options.rehypePlugins ?? (createDefaultRehypePlugins() as CompilerMdxOptions["rehypePlugins"]);
    const remarkPlugins = options.remarkPlugins ?? (createDefaultRemarkPlugins() as CompilerMdxOptions["remarkPlugins"]);

    return await compileMDX<Frontmatter>({
        source: rawMdx,
        options: {
            parseFrontmatter: true,
            mdxOptions: {
                rehypePlugins,
                remarkPlugins,
            },
        },
        components: options.components,
    });
}
