export const algoliaConfig: {
  appId: string | undefined
  apiKey: string | undefined
  indexName: string | undefined
  askAiAssistantId: string | undefined
} = {
  appId: process.env.NEXT_PUBLIC_ALGOLIA_DOCSEARCH_APP_ID,
  apiKey: process.env.NEXT_PUBLIC_ALGOLIA_DOCSEARCH_API_KEY,
  indexName: process.env.NEXT_PUBLIC_ALGOLIA_DOCSEARCH_INDEX_NAME,
  askAiAssistantId: process.env.NEXT_PUBLIC_ALGOLIA_DOCSEARCH_ASKAI_ASSISTANT_ID,
}
