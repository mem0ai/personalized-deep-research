import { streamText } from 'ai'
import type { TextStreamPart } from 'ai'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { languagePrompt, systemPrompt } from './prompt'
import { streamTextFromServer } from '~/composables/useAiProxy'
import { openai } from '@ai-sdk/openai'

type PartialFeedback = DeepPartial<z.infer<typeof feedbackTypeSchema>>

export const feedbackTypeSchema = z.object({
  questions: z.array(z.string()),
})

export async function* generateFeedback({
  query,
  language,
  numQuestions = 3,
}: {
  query: string
  language: string
  numQuestions?: number
}) {
  console.log("GENERATING FEEDBACK")
  const schema = z.object({
    questions: z
      .array(z.string())
      .describe(`Follow up questions to clarify the research direction`),
  })
  const jsonSchema = JSON.stringify(zodToJsonSchema(schema))
  const prompt = [
    `Given the following query from the user, ask ${numQuestions} follow up questions to clarify the research direction. Return a maximum of ${numQuestions} questions, but feel free to return less if the original query is clear: <query>${query}</query>`,
    `You MUST respond in JSON matching this JSON schema: ${jsonSchema}`,
    languagePrompt(language),
  ].join('\n\n')

  const stream = await streamTextFromServer({ prompt }) as AsyncIterable<TextStreamPart<any>>;
  
  console.log(stream, "STREAM")

  for await (const chunk of stream) {
    yield chunk;
  }

  // // collect all chunks
  // const chunks = [];
  // for await (const chunk of stream) {
  //   chunks.push(chunk);
  // }
  // // const text = chunks.map((chunk) => chunk.text).join('');


  const stream2 = streamText({
    model: openai('gpt-4o'),
    prompt: `Given the following query from the user, ask ${numQuestions} follow up questions to clarify the research direction. Return a maximum of ${numQuestions} questions, but feel free to return less if the original query is clear: <query>${query}</query>`,
  })

  console.log(stream2.fullStream, "STREAM2")

  return parseStreamingJson(
    stream2.fullStream,
    feedbackTypeSchema,
    (value: PartialFeedback) => !!value.questions && value.questions.length > 0,
  )
}
