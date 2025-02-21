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

export const useWebSearch = (): WebSearchFunction => {
  const runtimeConfig = useRuntimeConfig()
  // Provider is set internally via env.
  const provider = 'tavily' as string;

  switch (provider) {
    case 'firecrawl': {
      const fc = new Firecrawl({
        apiKey: runtimeConfig.public.firecrawlApiKey as string,
        apiUrl: runtimeConfig.public.firecrawlApiBase as string,
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
        apiKey: runtimeConfig.public.TAVILY_API_KEY as string,
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
