import type { ReactNode } from "react"

export type TocItem = {
  level: number
  text: string
  href: string
}

export type MdxCompileResult<Frontmatter> = {
  content: ReactNode
  frontmatter: Frontmatter
  scope?: Record<string, unknown>
}
