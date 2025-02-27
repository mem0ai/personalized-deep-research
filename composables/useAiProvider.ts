import { createDeepSeek } from '@ai-sdk/deepseek'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createOpenAI } from '@ai-sdk/openai'
import {
  extractReasoningMiddleware,
  wrapLanguageModel,
  type LanguageModelV1,
} from 'ai'
import { useRuntimeConfig } from '#imports'

export const useAiModel = () => {
  const { config, aiApiBase } = useConfigStore()
  const runtimeConfig = useRuntimeConfig()
  let model: LanguageModelV1

  const provider = 'openai' as string
  // These env variables are expected to be set for each provider.
  const apiKey = runtimeConfig.OPENAI_API_KEY as string
  const heliconeApiKey = runtimeConfig.HELICONE_API_KEY as string

  // Common headers for Helicone
  const heliconeHeaders = {
    'Helicone-Auth': `Bearer ${heliconeApiKey}`,
    'Helicone-Cache-Enabled': 'true'
  }

  if (provider === 'openrouter') {
    const openRouter = createOpenRouter({
      apiKey,
      baseURL: aiApiBase,
    })
    model = openRouter(config.ai.model, {
      includeReasoning: true,
    })
  } else if (
    provider === 'deepseek' ||
    provider === 'siliconflow' ||
    (config.ai.model && config.ai.model.toLowerCase().includes('deepseek'))
  ) {
    const deepSeek = createDeepSeek({
      apiKey,
      baseURL: aiApiBase,
    })
    model = deepSeek(config.ai.model)
  } else {
    // Default to OpenAI-compatible (also used for mem0)
    if (heliconeApiKey) {
      const openai = createOpenAI({
        apiKey,
        baseURL: 'https://oai.hconeai.com/v1',  // Helicone proxy URL
        headers: heliconeHeaders
      })
      model = openai(config.ai.model)
    } else {
      const openai = createOpenAI({
        apiKey,
        baseURL: aiApiBase,
      })
      model = openai(config.ai.model)
    }
  }

  return wrapLanguageModel({
    model,
    middleware: extractReasoningMiddleware({ tagName: 'think' }),
  })
}
