export async function streamTextFromServer({ prompt }: { prompt: string }) {
  const response = await fetch('/api/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  
  const stream = {
    async *[Symbol.asyncIterator]() {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield { type: 'text', text: decoder.decode(value, { stream: true }) } as const;
      }
    },
  };
  
  return stream;
}