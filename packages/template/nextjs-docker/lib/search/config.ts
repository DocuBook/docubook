import docuConfig from "@/docu.json"

export type SearchType = "default" | "algolia"

export const searchConfig = {
  type: (docuConfig.search?.type as SearchType) ?? "default",
}
