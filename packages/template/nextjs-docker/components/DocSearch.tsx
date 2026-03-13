"use client"

import { DocSearch } from "@docsearch/react"
import "@docsearch/css"
import { algoliaConfig } from "@/lib/search/algolia"
import { cn } from "@/lib/utils"

interface AlgoliaSearchProps {
  className?: string
}

export default function AlgoliaSearch({ className }: AlgoliaSearchProps) {
  const { appId, apiKey, indexName, askAiAssistantId } = algoliaConfig

  if (!appId || !apiKey || !indexName) {
    console.error("DocSearch credentials are not set in the environment variables.")
    return (
      <button className="text-muted-foreground text-sm" disabled>
        Search... (misconfigured)
      </button>
    )
  }

  return (
    <div className={cn("docsearch", className)}>
      <DocSearch
        appId={appId}
        apiKey={apiKey}
        indexName={indexName}
        placeholder="Search docs..."
        askAi={
          askAiAssistantId
            ? {
                assistantId: askAiAssistantId,
                suggestedQuestions: true,
              } as const
            : undefined
        }
      />
    </div>
  )
}
