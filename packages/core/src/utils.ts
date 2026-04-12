import type { Node } from "unist"

export interface ElementNode extends Node {
  type: string
  tagName?: string
  properties?: Record<string, unknown> & {
    className?: string[] | string
    raw?: string
  }
  data?: Record<string, unknown>
  children?: Node[]
  raw?: string
  language?: string
  codeTitle?: string
}
