import type { Node } from "unist";
import { visit } from "unist-util-visit";

interface CodeNode extends Node {
    type: "code";
    lang?: string;
    meta?: string;
    value: string;
    data?: {
        hProperties?: Record<string, unknown>;
    };
}

interface Element extends Node {
    type: string;
    tagName?: string;
    properties?: Record<string, unknown> & {
        className?: string[] | string;
        raw?: string;
    };
    data?: Record<string, unknown>;
    children?: Node[];
    raw?: string;
    language?: string;
    codeTitle?: string;
}

/**
 * Remark plugin to parse expandable metadata from code fences
 * Syntax: ```lang:filename showLineNumbers {lines} Expandable
 *
 * Adds hProperties to code node:
 * - data-expandable: 'true'
 * - data-expandable-lines: total line count
 */
export const handleCodeExpandableRemark = () => (tree: Node) => {
    visit(tree, "code", (node: CodeNode) => {
        if (!node.meta) return;

        const isExpandable = node.meta.includes("Expandable");
        const [languagePart, titlePart] = (node.lang ?? "").split(":");
        const normalizedLanguage = languagePart?.trim();
        const normalizedTitle = titlePart?.trim();

        if (isExpandable) {
            const lineCount = node.value.split("\n").length;

            if (!node.data) {
                node.data = {};
            }

            if (!node.data.hProperties) {
                node.data.hProperties = {};
            }

            node.data.hProperties["data-expandable"] = "true";
            node.data.hProperties["data-expandable-lines"] = lineCount.toString();
            if (normalizedLanguage) {
                node.data.hProperties["data-language"] = normalizedLanguage;
            }
            if (normalizedTitle) {
                node.data.hProperties["data-title"] = normalizedTitle;
            }

            const currentClassName = node.data.hProperties.className;
            const classList = Array.isArray(currentClassName)
                ? currentClassName
                : typeof currentClassName === "string"
                  ? currentClassName.split(" ").filter(Boolean)
                  : [];

            if (!classList.includes("mdx-expandable-meta")) {
                classList.push("mdx-expandable-meta");
            }

            node.data.hProperties.className = classList;

            if (normalizedLanguage && !node.meta.includes("dbLang(")) {
                node.meta = `${node.meta} dbLang(${normalizedLanguage})`.trim();
            }
            if (normalizedTitle && !node.meta.includes("dbTitle(")) {
                node.meta = `${node.meta} dbTitle(${normalizedTitle})`.trim();
            }
        }

    });
};

/**
 * Rehype plugin to transform expandable code blocks
 * Copies data-expandable metadata from <code> into <pre>
 * so custom React pre components can receive the attributes via props.
 */
export const handleCodeExpandable = () => (tree: Node) => {
    visit(tree, "element", (node: Element) => {
        if (node.tagName !== "pre") return;

        const codeElement = node.children?.find((child) => {
            const element = child as Element;
            return element.type === "element" && element.tagName === "code";
        }) as Element | undefined;

        const codeClassName = codeElement?.properties?.className;
        const codeClassList = Array.isArray(codeClassName)
            ? codeClassName
            : typeof codeClassName === "string"
              ? codeClassName.split(" ").filter(Boolean)
              : [];
        const codeMeta = typeof codeElement?.data?.meta === "string" ? codeElement.data.meta : undefined;
        const languageFromMeta = codeMeta?.match(/dbLang\(([^)]+)\)/)?.[1];
        const titleFromMeta = codeMeta?.match(/dbTitle\(([^)]+)\)/)?.[1];

        const isExpandable =
            codeElement?.properties?.["data-expandable"] === "true" ||
            codeClassList.includes("mdx-expandable-meta") ||
            codeMeta?.includes("Expandable") === true;
        const expandableLines = codeElement?.properties?.["data-expandable-lines"];

        if (!isExpandable) return;

        if (!node.properties) {
            node.properties = {};
        }

        node.properties["data-expandable"] = "true";
        if (typeof expandableLines === "string" || typeof expandableLines === "number") {
            node.properties["data-expandable-lines"] = expandableLines.toString();
        } else if (node.raw) {
            node.properties["data-expandable-lines"] = node.raw.split("\n").length.toString();
        }
        if (languageFromMeta) {
            node.properties["data-language"] = languageFromMeta;
        } else if (node.language) {
            node.properties["data-language"] = node.language;
        }
        if (titleFromMeta) {
            node.properties["data-title"] = titleFromMeta;
        } else if (node.codeTitle) {
            node.properties["data-title"] = node.codeTitle;
        }

        const className = node.properties.className;
        if (!className) {
            node.properties.className = [];
        }

        // Ensure className includes expandable marker
        if (Array.isArray(node.properties.className)) {
            if (!node.properties.className.includes("mdx-expandable-code")) {
                node.properties.className.push("mdx-expandable-code");
            }
        } else if (typeof className === "string") {
            const hasMarker = className.split(" ").includes("mdx-expandable-code");
            if (!hasMarker) {
                node.properties.className = `${className} mdx-expandable-code`
                    .trim()
                    .split(" ");
            }
        } else {
            node.properties.className = ["mdx-expandable-code"];
        }

        if (codeElement?.properties) {
            const cleanedCodeClassList = codeClassList.filter((className) => className !== "mdx-expandable-meta");
            codeElement.properties.className = cleanedCodeClassList;
        }
    });
};
