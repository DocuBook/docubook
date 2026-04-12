import type { Node } from "unist"
import { visit } from "unist-util-visit"
import type { ElementNode } from "../utils"


interface CodeNode extends Node {
  type: "code"
  lang?: string
  meta?: string
  value: string
  data?: {
    meta?: string
    hProperties?: Record<string, unknown>
  }
}

function countCodeLines(raw: string): number {
  let normalized = raw.replace(/\r\n/g, "\n")
  if (normalized.startsWith("\n")) normalized = normalized.slice(1)
  if (normalized.endsWith("\n")) normalized = normalized.slice(0, -1)

  if (normalized.length === 0) return 0
  return normalized.split("\n").length
}

export const handleCodeExpandableRemark = () => (tree: Node) => {
  visit(tree, "code", (node: CodeNode) => {
    if (!node.meta) return

    const isExpandable = node.meta.includes("Expandable")
    const [languagePart, titlePart] = (node.lang ?? "").split(":")
    const normalizedLanguage = languagePart?.trim()
    const normalizedTitle = titlePart?.trim()

    if (!isExpandable) return

    const lineCount = countCodeLines(node.value)

    if (!node.data) {
      node.data = {}
    }
    if (!node.data.hProperties) {
      node.data.hProperties = {}
    }

    node.data.hProperties["data-expandable"] = "true"
    node.data.hProperties["data-expandable-lines"] = lineCount.toString()

    if (normalizedLanguage) {
      node.data.hProperties["data-language"] = normalizedLanguage
    }
    if (normalizedTitle) {
      node.data.hProperties["data-title"] = normalizedTitle
    }

    const currentClassName = node.data.hProperties.className
    const classList = Array.isArray(currentClassName)
      ? currentClassName
      : typeof currentClassName === "string"
        ? currentClassName.split(" ").filter(Boolean)
        : []

    if (!classList.includes("mdx-expandable-meta")) {
      classList.push("mdx-expandable-meta")
    }

    node.data.hProperties.className = classList

    if (normalizedLanguage && !node.meta.includes("dbLang(")) {
      node.meta = `${node.meta} dbLang(${normalizedLanguage})`.trim()
    }
    if (normalizedTitle && !node.meta.includes("dbTitle(")) {
      node.meta = `${node.meta} dbTitle(${normalizedTitle})`.trim()
    }
  })
}

export const handleCodeExpandable = () => (tree: Node) => {
  visit(tree, "element", (node: ElementNode) => {
    if (node.tagName !== "pre") return

    const codeElement = node.children?.find((child) => {
      const element = child as ElementNode
      return element.type === "element" && element.tagName === "code"
    }) as ElementNode | undefined

    const codeClassName = codeElement?.properties?.className
    const codeClassList = Array.isArray(codeClassName)
      ? codeClassName
      : typeof codeClassName === "string"
        ? codeClassName.split(" ").filter(Boolean)
        : []

    const codeMeta =
      codeElement?.data &&
      typeof codeElement.data === "object" &&
      typeof codeElement.data["meta"] === "string"
        ? (codeElement.data["meta"] as string)
        : undefined

    const languageFromMeta = codeMeta?.match(/dbLang\(([^)]+)\)/)?.[1]
    const titleFromMeta = codeMeta?.match(/dbTitle\(([^)]+)\)/)?.[1]

    const languageFromProps =
      typeof codeElement?.properties?.["data-language"] === "string"
        ? (codeElement.properties["data-language"] as string)
        : undefined
    const titleFromProps =
      typeof codeElement?.properties?.["data-title"] === "string"
        ? (codeElement.properties["data-title"] as string)
        : undefined

    const languageFromCodeClass = codeClassList
      .find((item) => item.startsWith("language-"))
      ?.replace("language-", "")

    const existingPreLanguage =
      typeof node.properties?.["data-language"] === "string"
        ? (node.properties["data-language"] as string)
        : undefined
    const existingPreTitle =
      typeof node.properties?.["data-title"] === "string"
        ? (node.properties["data-title"] as string)
        : undefined

    const isExpandable =
      codeElement?.properties?.["data-expandable"] === "true" ||
      codeClassList.includes("mdx-expandable-meta") ||
      codeMeta?.includes("Expandable") === true

    const expandableLines = codeElement?.properties?.["data-expandable-lines"]
    if (!isExpandable) return

    if (!node.properties) {
      node.properties = {}
    }

    node.properties["data-expandable"] = "true"
    if (typeof expandableLines === "string" || typeof expandableLines === "number") {
      node.properties["data-expandable-lines"] = expandableLines.toString()
    } else if (node.raw) {
      node.properties["data-expandable-lines"] = countCodeLines(node.raw).toString()
    }

    const resolvedLanguage =
      languageFromProps ||
      languageFromMeta ||
      languageFromCodeClass ||
      existingPreLanguage ||
      node.language
    const resolvedTitle = titleFromProps || titleFromMeta || existingPreTitle || node.codeTitle

    if (resolvedLanguage) {
      node.properties["data-language"] = resolvedLanguage
    }
    if (resolvedTitle) {
      node.properties["data-title"] = resolvedTitle
    }

    const className = node.properties.className
    if (!className) {
      node.properties.className = []
    }

    if (Array.isArray(node.properties.className)) {
      if (!node.properties.className.includes("mdx-expandable-code")) {
        node.properties.className.push("mdx-expandable-code")
      }
    } else if (typeof className === "string") {
      const hasMarker = className.split(" ").includes("mdx-expandable-code")
      if (!hasMarker) {
        node.properties.className = `${className} mdx-expandable-code`.trim().split(" ")
      }
    } else {
      node.properties.className = ["mdx-expandable-code"]
    }

    if (codeElement?.properties) {
      const cleanedCodeClassList = codeClassList.filter((item) => item !== "mdx-expandable-meta")
      codeElement.properties.className = cleanedCodeClassList
    }
  })
}
