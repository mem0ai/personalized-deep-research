<template>
  <UModal v-model:open="isOpen" title="Edit Memory">
    <template #body>
      <p class="mb-2">
        Make changes to your memory here. Click save when you're done.
      </p>
      <!-- Simple input for editing the memory text -->
      <UInput v-model="editedText" class="w-full" />
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="error" @click="deleteMemory">Delete</UButton>
        <UButton color="primary" @click="saveMemory">Save Changes</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'

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

function saveMemory() {
  if (props.memory) {
    // Emit an update event with the modified memory
    emit('updateMemory', { ...props.memory, memory: editedText.value })
    isOpen.value = false
  }
}

function deleteMemory() {
  if (props.memory) {
    emit('deleteMemory', props.memory.id)
    isOpen.value = false
  }
}
</script>
