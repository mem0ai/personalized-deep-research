<template>
  <UModal v-model:open="isOpen" title="Edit Memory">
    <template #body>
      <p class="mb-2">
        Make changes to your memory here. Click save when you're done.
      </p>
      <!-- UTextarea now uses computedRows for its rows prop -->
      <UTextarea v-model="editedText" class="w-full" :rows="computedRows" />
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton variant="outline" color="primary" @click="deleteMemory">Delete</UButton>
        <UButton color="primary" @click="saveMemory">Save Changes</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch, computed, defineProps, defineEmits } from 'vue'

interface Memory {
  id: string;
  memory?: string;
  // ...other properties if needed
}

// Props: the memory to edit (or null to close the modal)
const props = defineProps<{ memory: Memory | null }>()
const emit = defineEmits<{ 
  (e: 'updateMemory', updated: Memory): void, 
  (e: 'deleteMemory', id: string): void 
}>()

const isOpen = ref(false)
const editedText = ref('')

// Compute rows based on the sentence length when the modal is initialized.
const computedRows = computed(() => {
  const len = editedText.value.length
  if (len < 100) return 2
  if (len < 150) return 3
  if (len < 200) return 4
  return 5
})

// When the memory prop changes, update local state and open the modal
watch(
  () => props.memory,
  (newMemory) => {
    if (newMemory) {
      editedText.value = newMemory.memory || ''
      isOpen.value = true
    } else {
      isOpen.value = false
    }
  },
  { immediate: true }
)

async function saveMemory() {
  if (props.memory) {
    try {
      // Then emit the update event with the modified memory
      emit('updateMemory', { ...props.memory, memory: editedText.value })
      isOpen.value = false
    } catch (error) {
      console.error('Error updating memory:', error)
    }
  }
}

async function deleteMemory() {
  if (props.memory && window.confirm("Are you sure you want to delete this memory?")) {
    try {
      emit('deleteMemory', props.memory.id)
      isOpen.value = false
    } catch (error) {
      console.error('Error deleting memory:', error)
    }
  }
}
</script>
