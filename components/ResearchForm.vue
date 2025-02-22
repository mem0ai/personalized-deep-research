<script setup lang="ts">
  import { formInjectionKey } from '~/constants/injection-keys'

  export interface ResearchInputData {
    query: string
    breadth: number
    depth: number
    numQuestions: number
  }

  defineProps<{
    isLoadingFeedback: boolean
  }>()

  const emit = defineEmits<{
    (e: 'submit'): void
  }>()

  const form = inject(formInjectionKey)!

  const isSubmitButtonDisabled = computed(
    () =>
      !form.value.query ||
      !form.value.breadth ||
      !form.value.depth ||
      !form.value.numQuestions,
  )

  function handleSubmit() {
    emit('submit')
  }
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-bold">{{ $t('researchTopic.title') }}</h2>
    </template>
    <div class="flex flex-col gap-2">
      <UFormField :label="$t('researchTopic.inputTitle')" required>
        <UTextarea
          class="w-full"
          v-model="form.query"
          :rows="3"
          :placeholder="$t('researchTopic.placeholder')"
          required
        />
      </UFormField>
    </div>

    <template #footer>
      <UButton
        type="submit"
        color="primary"
        :loading="isLoadingFeedback"
        :disabled="isSubmitButtonDisabled"
        block
        @click="handleSubmit"
      >
        {{
          isLoadingFeedback
            ? $t('researchTopic.researching')
            : $t('researchTopic.start')
        }}
      </UButton>
    </template>
  </UCard>
</template>
