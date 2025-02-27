// composables/useAiProxy.ts

export async function streamTextFromServer({ prompt }: { prompt: string; }) {
  // Use the browser fetch API to call the server endpoint.
  // Note: If you need to support streaming on the client side, you might need to
  // work with the Response.body stream directly.
  const response = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  
  // Return the readable stream from the response.
  // You can then pass this stream into your parseStreamingJson logic.
  return response.body
}
