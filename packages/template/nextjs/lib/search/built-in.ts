import { ROUTES, type EachRoute } from "../routes"

export type SearchResult = {
  title: string
  href: string
  noLink?: boolean
  items?: undefined
  score?: number
}

function helperSearch(
  query: string,
  node: EachRoute,
  prefix: string,
  currenLevel: number,
  maxLevel?: number
) {
  const res: EachRoute[] = []
  let parentHas = false

  const nextLink = `${prefix}${node.href}`
  if (!node.noLink && node.title.toLowerCase().includes(query.toLowerCase())) {
    res.push({ ...node, items: undefined, href: nextLink })
    parentHas = true
  }
  const goNext = maxLevel ? currenLevel < maxLevel : true
  if (goNext)
    node.items?.forEach((item) => {
      const innerRes = helperSearch(query, item, nextLink, currenLevel + 1, maxLevel)
      if (!!innerRes.length && !parentHas && !node.noLink) {
        res.push({ ...node, items: undefined, href: nextLink })
        parentHas = true
      }
      res.push(...innerRes)
    })
  return res
}

export function advanceSearch(query: string) {
  return ROUTES.map((node) =>
    helperSearch(query, node, "", 1, query.length == 0 ? 2 : undefined)
  ).flat()
}
