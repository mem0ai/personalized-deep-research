import type { TextStreamPart } from 'ai'

export async function streamTextFromServer({ prompt, modelName }: { prompt: string, modelName: string }): Promise<AsyncIterable<TextStreamPart<any>>> {
  const response = await fetch('/api/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, modelName }),
  });
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  
  const stream = {
    async *[Symbol.asyncIterator]() {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const textDelta = decoder.decode(value, { stream: true });
        yield { type: 'text-delta', textDelta } as TextStreamPart<any>;
      }
    }
  };
  
  return stream;
}
