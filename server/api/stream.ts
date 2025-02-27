// /server/api/ai/stream.ts

import { defineEventHandler, readBody, createError } from 'h3'
import { streamText } from 'ai'
import { systemPrompt } from '../../lib/prompt'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createOpenAI } from '@ai-sdk/openai'
import {
  extractReasoningMiddleware,
  wrapLanguageModel,
  type LanguageModelV1,
} from 'ai'

export default defineEventHandler(async (event) => {
  // Read the POST data sent from the client
  const body = await readBody(event)
  const { prompt } = body

  if (!prompt) {
    throw createError({ statusCode: 400, message: 'Prompt is required.' })
  }

  // Create the model instance (defaulting to a fallback model if needed)
  const modelInstance = useAiModel();

  try {
    // Use the streaming function to get the response
    const stream = await streamText({
      model: modelInstance,
      prompt,
      system: systemPrompt(),
    })
    // Return the stream as the response
    return stream
  } catch (error) {
    console.error('Error calling the AI provider:', error)
    throw createError({ statusCode: 500, message: 'Internal Server Error' })
  }
})

const useAiModel = () => {
  const runtimeConfig = useRuntimeConfig()
  let model: LanguageModelV1

  // These env variables are expected to be set for each provider.
  const apiKey = runtimeConfig.OPENAI_API_KEY as string
  const heliconeApiKey = runtimeConfig.HELICONE_API_KEY as string

  // Common headers for Helicone
  const heliconeHeaders = {
    'Helicone-Auth': `Bearer ${heliconeApiKey}`,
    'Helicone-Cache-Enabled': 'true'
  }

  // Default to OpenAI-compatible (also used for mem0)
  if (heliconeApiKey) {
    const openai = createOpenAI({
      apiKey,
      baseURL: 'https://oai.hconeai.com/v1',  // Helicone proxy URL
      headers: heliconeHeaders
    })
    model = openai('gpt-3.5-turbo')
  } else {
    const openai = createOpenAI({
      apiKey,
      baseURL: 'https://api.openai.com/v1',
    })
    model = openai('gpt-3.5-turbo')
  }

  return wrapLanguageModel({
    model,
    middleware: extractReasoningMiddleware({ tagName: 'think' }),
  })
}
