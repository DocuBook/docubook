import matter from "gray-matter"
import type { TocItem } from "./types"

const FENCE_MARKER_REGEX = /^(````|```)(?!`)/
const HEADING_REGEX = /^(#{2,4})\s+(.+)$/
const RELEASE_VERSION_ATTR_REGEX = /\bversion\s*=\s*"([^"]+)"/

export function sluggify(text: string): string {
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
  const slug = normalized.toLowerCase().replace(/\s+/g, "-")
  return slug.replace(/[^a-z0-9-]/g, "")
}

function parseReleaseVersionFromLine(line: string): string | null {
  const releaseStart = line.indexOf("<Release")
  if (releaseStart === -1) {
    return null
  }

  // Parse only the first tag fragment on the line to avoid broad regex scans.
  const fragment = line.slice(releaseStart, releaseStart + 512)
  const closingIndex = fragment.indexOf(">")
  if (closingIndex === -1) {
    return null
  }

  const tag = fragment.slice(0, closingIndex + 1)
  if (!/^<Release\b/.test(tag)) {
    return null
  }

  const attrMatch = RELEASE_VERSION_ATTR_REGEX.exec(tag)
  const version = attrMatch?.[1] ?? ""
  return version.trim() || null
}

export function extractTocsFromRawMdx(rawMdx: string): TocItem[] {
  const extractedHeadings: TocItem[] = []

  const lines = rawMdx.split(/\r?\n/)
  let inFence = false
  let fenceLength = 0

  for (const line of lines) {
    const trimmed = line.trimStart()

    const fenceMatch = FENCE_MARKER_REGEX.exec(trimmed)
    if (fenceMatch) {
      const marker = fenceMatch[1]

      if (!inFence) {
        inFence = true
        fenceLength = marker.length
      } else if (marker.length === fenceLength) {
        inFence = false
      }

      continue
    }

    if (inFence) {
      continue
    }

    const headingMatch = HEADING_REGEX.exec(trimmed)
    if (headingMatch) {
      const headingLevel = headingMatch[1].length
      const headingText = headingMatch[2].trim().replace(/\s+#+\s*$/, "")
      extractedHeadings.push({
        level: headingLevel,
        text: headingText,
        href: `#${sluggify(headingText)}`,
      })
      continue
    }

    const version = parseReleaseVersionFromLine(line)
    if (version) {
      extractedHeadings.push({
        level: 2,
        text: `v${version}`,
        href: `#${version}`,
      })
    }
  }

  return extractedHeadings
}

export function extractFrontmatter<Frontmatter>(content: string): Frontmatter {
  try {
    return matter(content).data as Frontmatter
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to extract frontmatter: ${reason}`)
  }
}

/**
 * Extract frontmatter and return both the parsed data and the content
 * with the frontmatter block stripped. Avoids a second parse by compileMDX.
 */
export function extractFrontmatterWithContent<Frontmatter>(content: string): {
  frontmatter: Frontmatter
  strippedContent: string
} {
  const { data, content: strippedContent } = matter(content)
  return { frontmatter: data as Frontmatter, strippedContent }
}
