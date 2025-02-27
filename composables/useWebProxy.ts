export type WebSearchResult = {
  content: string
  url: string
  title?: string
}

export async function searchWebFromServer({
  query,
  maxResults,
}: {
  query: string
  maxResults: number
}): Promise<WebSearchResult[]> {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, maxResults }),
  })

  if (!response.ok) {
    throw new Error('Network response was not ok')
  }

  const data = await response.json()
  return data.results
}
