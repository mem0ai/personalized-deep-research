<script setup lang="ts">
import { ref, computed } from 'vue'
import { saveToMem0 } from '~/lib/mem0'
const resume = ref<string>('')
const isLoading = ref(false)
const emit = defineEmits<{ (e: 'submit', resume: string): void }>()
// Disable the submit button if the resume is empty (after trimming)
const isSubmitDisabled = computed(() => resume.value.trim().length === 0)
async function handleSubmit() {
  try {
    isLoading.value = true
    await saveToMem0(resume.value)
    emit('submit', resume.value)
  } catch (error) {
    console.error('Error submitting resume:', error)
    // You may want to add error handling UI here
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-bold">1. Submit Your Resume</h2>
    </template>

    <div class="flex flex-col gap-2">
      <UFormField label="Resume" required>
        <UTextarea
          class="w-full"
          v-model="resume"
          :rows="10"
          placeholder="Paste your resume here..."
          required
        />
      </UFormField>
    </div>

    <template #footer>
      <UButton
        type="submit"
        color="primary"
        :loading="isLoading"
        :disabled="isSubmitDisabled"
        block
        @click="handleSubmit"
      >
        {{ isLoading ? 'Submitting...' : 'Submit Resume' }}
      </UButton>
    </template>
  </UCard>
</template>