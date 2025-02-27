import { skipHydrate } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import type { Locale } from '~/components/LangSwitcher.vue'

export type ConfigAiProvider =
  | 'openai-compatible'
  | 'siliconflow'
  | 'openrouter'
  | 'deepseek'
  | 'ollama'

export type ConfigWebSearchProvider = 'tavily' | 'firecrawl'

export interface ConfigAi {
  provider: ConfigAiProvider
  mem0ApiKey?: string
  model: string
  contextSize?: number
  numQuestions: number
  depth: number
  breadth: number
}

export interface ConfigWebSearch {
  searchLanguage?: Locale
}

export interface Config {
  ai: ConfigAi
  webSearch: ConfigWebSearch
}

function validateConfig(config: Config) {
  const ai = config.ai
  if (ai.provider === 'openai-compatible' && !ai.mem0ApiKey) return false
  if (typeof ai.contextSize !== 'undefined' && ai.contextSize < 0) return false

  return true
}

export const useConfigStore = defineStore('config', () => {
  // Use serializer options to ensure proper JSON parsing.
  const config = useLocalStorage<Config>('deep-research-config', {
    ai: {
      // Set the internal provider to OpenAI-compatible for model fetching.
      provider: 'openai-compatible',
      model: '',
      contextSize: 128000,
      numQuestions: 3,
      depth: 2,
      breadth: 2,
    },
    webSearch: {
      searchLanguage: 'en',
    },
  } satisfies Config)
  const dismissUpdateVersion = useLocalStorage<string>('dismiss-update-version', '')

  const isConfigValid = computed(() => validateConfig(config.value))

  const aiApiBase = computed(() => {
    return 'https://api.openai.com/v1'
  })
  const webSearchApiBase = computed(() => {
    return
  })

  const showConfigManager = ref(false)

  return {
    config: skipHydrate(config),
    isConfigValid,
    aiApiBase,
    webSearchApiBase,
    showConfigManager,
    dismissUpdateVersion: skipHydrate(dismissUpdateVersion),
  }
})
