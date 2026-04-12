import { compileMDX } from "next-mdx-remote/rsc"
import type { Node, Parent } from "unist"
import { visit } from "unist-util-visit"
import remarkGfm from "remark-gfm"
import rehypePrism from "rehype-prism-plus"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeSlug from "rehype-slug"
import rehypeCodeTitles from "rehype-code-titles"
import { handleCodeTitles } from "./plugins/handleCodeTitles"
import { handleCodeExpandableRemark, handleCodeExpandable } from "./plugins/handleCodeExpandable"
import type { MdxCompileResult } from "./types"

interface Element extends Node {
  type: string
  tagName?: string
  properties?: Record<string, unknown> & {
    className?: string[] | string
    raw?: string
  }
  children?: Node[]
  raw?: string
  language?: string
  codeTitle?: string
}

interface TextNode extends Node {
  type: "text"
  value: string
}

type CompileMdxInput = Parameters<typeof compileMDX<Record<string, unknown>>>[0]
type CompileMdxOptions = NonNullable<CompileMdxInput["options"]>
type CompilerMdxOptions = NonNullable<CompileMdxOptions["mdxOptions"]>

export type ParseMdxOptions = {
  components?: CompileMdxInput["components"]
  rehypePlugins?: CompilerMdxOptions["rehypePlugins"]
  remarkPlugins?: CompilerMdxOptions["remarkPlugins"]
  /**
   * Whether to parse frontmatter during MDX compilation.
   * Set to `false` when frontmatter is already extracted separately
   * (e.g. via gray-matter) to avoid redundant parsing.
   * Defaults to `true`.
   */
  parseFrontmatter?: boolean
}

export const preProcess = () => (tree: Node) => {
  visit(tree, (node: Node) => {
    const element = node as Element
    if (element?.type === "element" && element?.tagName === "pre" && element.children) {
      const [codeEl] = element.children as Element[]
      if (codeEl.tagName !== "code" || !codeEl.children?.[0]) return

      const className = codeEl.properties?.className
      const classList = Array.isArray(className)
        ? className
        : typeof className === "string"
          ? className.split(" ").filter(Boolean)
          : []
      const languageClass = classList.find((item: string) => item.startsWith("language-"))
      if (languageClass) {
        element.language = languageClass.replace("language-", "").split(":")[0]
      }

      const textNode = codeEl.children[0] as TextNode
      if (textNode.type === "text" && textNode.value) {
        element.raw = textNode.value
      }
    }
  })
}

export const postProcess = () => (tree: Node) => {
  visit(tree, "element", (node: Node) => {
    const element = node as Element
    if (element?.type === "element" && element?.tagName === "pre") {
      if (element.properties && element.raw) {
        element.properties.raw = element.raw
      }
      if (element.properties && element.language && !element.properties["data-language"]) {
        element.properties["data-language"] = element.language
      }
      if (element.properties && element.codeTitle && !element.properties["data-title"]) {
        element.properties["data-title"] = element.codeTitle
      }
    }
  })
}

export function createDefaultRehypePlugins(): unknown[] {
  return [
    preProcess,
    rehypeCodeTitles,
    handleCodeTitles,
    handleCodeExpandable,
    rehypePrism,
    handleCodeExpandable,
    rehypeSlug,
    rehypeAutolinkHeadings,
    postProcess,
  ]
}

export function createDefaultRemarkPlugins(): unknown[] {
  return [remarkGfm, handleCodeExpandableRemark]
}

export async function parseMdx<Frontmatter>(
  rawMdx: string,
  options: ParseMdxOptions = {}
): Promise<MdxCompileResult<Frontmatter>> {
  const rehypePlugins =
    options.rehypePlugins ?? (createDefaultRehypePlugins() as CompilerMdxOptions["rehypePlugins"])
  const remarkPlugins =
    options.remarkPlugins ?? (createDefaultRemarkPlugins() as CompilerMdxOptions["remarkPlugins"])

  return await compileMDX<Frontmatter>({
    source: rawMdx,
    options: {
      parseFrontmatter: options.parseFrontmatter ?? true,
      mdxOptions: {
        rehypePlugins,
        remarkPlugins,
      },
    },
    components: options.components,
  })
}
