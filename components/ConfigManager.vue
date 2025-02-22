<script setup lang="ts">
  import { useRuntimeConfig } from '#imports'
  interface OpenAICompatibleModel {
    id: string
    object: string
  }
  interface OpenAICompatibleModelsResponse {
    object: string
    data: OpenAICompatibleModel[]
  }

  const { config, aiApiBase, showConfigManager: showModal } = storeToRefs(useConfigStore())
  const runtimeConfig = useRuntimeConfig()
  const { t } = useI18n()

  // Force the internal provider to remain as OpenAI-compatible.
  // (Internal keys for OpenAI are set via env and stored in config.ai.apiKey and config.ai.apiBase.)
  config.value.ai.provider = 'openai-compatible'

  // State for model fetching
  const loadingAiModels = ref(false)
  const aiModelOptions = ref<string[]>([])
  const isLoadAiModelsFailed = ref(false)

  // Debounced function: fetch the list of available OpenAI models using the internal OpenAI API key.
  const debouncedListAiModels = useDebounceFn(async () => {
    if (!config.value.ai.mem0ApiKey) return
    try {
      loadingAiModels.value = true
      const result: OpenAICompatibleModelsResponse = await $fetch(
        `https://api.openai.com/v1/models`,
        {
          headers: {
            Authorization: `Bearer ${runtimeConfig.public.OPENAI_API_KEY}`,
          },
        }
      )
      console.log(`Found ${result.data.length} models for provider OpenAI`)
      aiModelOptions.value = result.data.map((m) => m.id)
      isLoadAiModelsFailed.value = false

      // Ensure the current model is in the list.
      if (aiModelOptions.value.length) {
        const currentModel = config.value.ai.model
        if (currentModel && !aiModelOptions.value.includes(currentModel)) {
          aiModelOptions.value.unshift(currentModel)
        }
      }
    } catch (error) {
      console.error(`Fetch models failed`, error)
      isLoadAiModelsFailed.value = true
      aiModelOptions.value = []
    } finally {
      console.log(config)
      console.log(runtimeConfig)
      loadingAiModels.value = false
    }
  }, 500)

  function createAndSelectAiModel(model: string) {
    aiModelOptions.value.push(model)
    config.value.ai.model = model
  }

  // Watch only the internal API key, API base, and modal visibility.
  watch(
    () => [config.value.ai.mem0ApiKey, aiApiBase.value, showModal.value],
    () => {
      if (showModal.value) debouncedListAiModels()
    },
    { immediate: true }
  )

  defineExpose({
    show() {
      showModal.value = true
    },
  })
</script>

<template>
  <div>
    <UModal v-model:open="showModal" :title="$t('settings.title')">
      <UButton icon="i-lucide-settings" />

      <template #body>
        <div class="flex flex-col gap-y-4">
          <!-- 1) Mem0 API Key (user editable) -->
          <UFormField label="Mem0 API Key" required>
            <PasswordInput
              v-model="config.ai.mem0ApiKey"
              class="w-full"
              placeholder="Enter your Mem0 API key"
            />
            <template #help>
              <span
                v-html="$t('settings.ai.providers.mem0.description', ['<a href=\'https://app.mem0.ai/dashboard\' target=\'_blank\' class=\'text-blue-500 underline\'>Mem0</a>'])"
              ></span>
            </template>
          </UFormField>

          <!-- 2) OpenAI Model Selection (fetched using internal OpenAI key/base) -->
          <UFormField :label="$t('settings.ai.model')" required>
            <UInputMenu
              v-if="aiModelOptions.length && !isLoadAiModelsFailed"
              v-model="config.ai.model"
              class="w-full"
              :items="aiModelOptions"
              :placeholder="$t('settings.ai.model')"
              :loading="loadingAiModels"
              create-item
              @create="createAndSelectAiModel"
            />
            <UInput
              v-else
              v-model="config.ai.model"
              class="w-full"
              :placeholder="$t('settings.ai.model')"
            />
          </UFormField>

          <!-- 3) Context Size -->
          <UFormField :label="$t('settings.ai.contextSize')">
            <template #help>
              {{ $t('settings.ai.contextSizeHelp') }}
            </template>
            <UInput
              v-model="config.ai.contextSize"
              class="w-26"
              type="number"
              placeholder="128000"
              :min="512"
            />
            tokens
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-between gap-2 w-full">
          <p class="text-sm text-gray-500">{{ $t('settings.disclaimer') }}</p>
          <UButton color="primary" icon="i-lucide-check" @click="showModal = false">
            {{ $t('settings.save') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
