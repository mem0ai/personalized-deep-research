import { defineEventHandler, readBody, createError } from 'h3'
import { tavily } from '@tavily/core'
import Firecrawl from '@mendable/firecrawl-js'
import { useRuntimeConfig } from '#imports'

type WebSearchOptions = {
  maxResults?: number
  /** The search language, e.g. `en`. Only works for Firecrawl. */
  lang?: string
}

export type WebSearchResult = {
  content: string
  url: string
  title?: string
}

type WebSearchFunction = (
  query: string,
  options: WebSearchOptions,
) => Promise<WebSearchResult[]>

export default defineEventHandler(async (event) => {
  // Read the POST data sent from the client
  const body = await readBody(event)
  const { query, maxResults } = body

  if (!query || typeof query !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing or invalid query parameter'
    })
  }

  // Create the server-side search function instance
  const webSearch = useWebSearch()

  try {
    // Call the web search function with the query and any default options
    const results = await webSearch(query, { maxResults: maxResults, lang: 'en' })
    return { results }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Search failed'
    })
  }
})

export const useWebSearch = (): WebSearchFunction => {
  const runtimeConfig = useRuntimeConfig()
  // Choose the provider; adjust this value as needed.
  const provider = 'tavily' as string

  switch (provider) {
    case 'firecrawl': {
      const fc = new Firecrawl({
        apiKey: runtimeConfig.firecrawlApiKey as string,
        apiUrl: runtimeConfig.firecrawlApiBase as string,
      })
      return async (q: string, o: WebSearchOptions) => {
        const results = await fc.search(q, o)
        if (results.error) {
          throw new Error(results.error)
        }
        return results.data
          .filter((x) => !!x?.markdown && !!x.url)
          .map((r) => ({
            content: r.markdown!,
            url: r.url!,
            title: r.title,
          }))
      }
    }
    case 'tavily':
    default: {
      const tvly = tavily({
        apiKey: runtimeConfig.TAVILY_API_KEY as string,
      })
      return async (q: string, o: WebSearchOptions) => {
        const results = await tvly.search(q, o)
        return results.results
          .filter((x) => !!x?.content && !!x.url)
          .map((r) => ({
            content: r.content,
            url: r.url,
            title: r.title,
          }))
      }
    }
  }
}
