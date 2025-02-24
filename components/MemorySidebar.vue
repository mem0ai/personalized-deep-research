<template>
  <aside :class="asideClasses" class="bg-white dark:bg-[#18181b]">
    <div class="sidebar-inner flex flex-col border-l border-gray-200 dark:border-gray-700 h-full">
      <!-- Collapse toggle button - Only visible on desktop -->
      <div
        v-if="!isMobileView"
        class="toggle-container absolute inset-x-0 top-1/2 -translate-y-1/2 -left-4 z-20"
      >
        <button
          class="toggle-btn flex items-center justify-center w-8 h-8 border rounded-md light:bg-white dark:bg-[#18181b] border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          @click="toggleSidebar"
          :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="chevron-icon transform transition-transform duration-500"
            :class="{ '-rotate-180': isCollapsed }"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </button>
      </div>
  
      <!-- Only show content when not collapsed or on mobile -->
      <div v-if="!isCollapsed || isMobileView" class="flex flex-col flex-1 max-h-full border border-l-0 border-b border-gray-200 dark:border-gray-700">
        <!-- Header -->
        <div class="sidebar-header flex justify-between items-center p-2 pl-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex flex-1 items-center gap-2">
            <h2 class="text-base font-semibold text-gray-800 dark:text-gray-200">
              Your Memories ({{ memories.length }})
            </h2>
          </div>
          <div class="flex gap-2">
            <!-- Mobile-only close button -->
            <button
              v-if="isMobileView"
              class="action-btn flex items-center justify-center w-9 h-9 border rounded-md bg-transparent border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              @click="closeMobileSidebar"
              title="Close Sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>
            
            <button
              :class="['action-btn flex items-center justify-center w-9 h-9 border rounded-md bg-transparent border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors',
              { 'pointer-events-none opacity-50 cursor-not-allowed': isLoading }]"
              @click="fetchMemories"
              :disabled="isLoading"
              title="Refresh Memories"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4"
                :class="{ 'animate-spin': isLoading }"
              >
                <path
                  d="M1.85 7.5C1.85 4.664 4.06 1.85 7.5 1.85C10.278 1.85 11.652 3.906 12.237 5H10.5C10.224 5 10 5.224 10 5.5C10 5.776 10.224 6 10.5 6H13.5C13.776 6 14 5.776 14 5.5V2.5C14 2.224 13.776 2 13.5 2C13.224 2 13 2.224 13 2.5V4.313C12.296 3.071 10.666 0.85 7.5 0.85C3.437 0.85 0.85 4.185 0.85 7.5C0.85 10.815 3.437 14.15 7.5 14.15C9.444 14.15 11.062 13.381 12.215 12.208C12.832 11.581 13.313 10.839 13.642 10.041C13.747 9.785 13.625 9.493 13.37 9.388C13.114 9.283 12.822 9.405 12.717 9.66C12.436 10.343 12.025 10.975 11.501 11.507C10.53 12.496 9.165 13.15 7.5 13.15C4.06 13.15 1.85 10.335 1.85 7.5Z"
                  fill="currentColor"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </button>
            <button
              class="action-btn flex items-center justify-center w-9 h-9 border rounded-md bg-transparent border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              @click="deleteAllMemories"
              :disabled="isLoading"
              title="Delete All Memories"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="icon trash-icon"
              >
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
  
        <!-- Memory list -->
        <div class="memory-list flex-1 overflow-y-scroll p-2 overscroll-contain" dir="ltr">
          <div v-if="memories.length > 0">
            <div
              v-for="memory in reversedMemories"
              :key="memory.id"
              class="memory-item p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              @click="selectMemory(memory)"
            >
              <div class="memory-content mb-2 text-sm text-gray-800 dark:text-gray-200">
                {{ memory.memory }}
              </div>
              <div class="memory-categories flex flex-wrap gap-2 mb-1">
                <span
                  v-for="category in memory.categories"
                  :key="category"
                  class="inline-flex items-center rounded-md border border-gray-200 dark:border-gray-700 px-2.5 py-0.5 font-semibold text-xs text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {{ category }}
                </span>
              </div>
              <div class="text-xs text-gray-500">
                {{ new Date(memory.updated_at).toLocaleString() }}
              </div>
            </div>
          </div>
          <p v-else class="mt-4 text-center text-gray-500">
            No memories found. Your memories will appear here.
          </p>
        </div>
      </div>
    </div>
    <!-- Edit Memory Modal -->
    <EditMemoryModal
      :memory="selectedMemory"
      @updateMemory="handleMemoryUpdate"
      @deleteMemory="handleMemoryDelete"
    />
  </aside>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch, nextTick, defineEmits, defineProps } from 'vue'
  import { useMem0Client } from '../lib/mem0'
  import EditMemoryModal from './EditMemoryModal.vue'

  interface Memory {
    id: string
    memory?: string
    user_id?: string
    metadata?: any
    categories?: string[]
    created_at?: any
    updated_at?: any
  }

  const props = defineProps<{ 
    trigger: boolean, 
    fetchTrigger: boolean,
    isMobileOpen?: boolean  // New prop to control mobile sidebar visibility
  }>()

  const emit = defineEmits<{ 
    (e: 'collapse-change', width: number): void,
    (e: 'mobile-close'): void  // New event to notify parent when mobile sidebar is closed
  }>()

  const isCollapsed = ref(true)
  const isMobileView = ref(false)
  const isLoading = ref(false)
  const memories = ref<Memory[]>([])
  const selectedMemory = ref<Memory | null>(null)
  const userId = ref<string>('')
  const windowWidth = ref(window ? window.innerWidth : 1024)

  const { config } = useConfigStore()
  const getUserId = (): string => 'dummyUserId'

  // Update window width on resize
  const updateWindowWidth = () => {
    windowWidth.value = window.innerWidth
    isMobileView.value = windowWidth.value < 1024
    
    // Auto-collapse on mobile
    if (isMobileView.value && !props.isMobileOpen) {
      isCollapsed.value = true
    }
    
    // Update parent component
    updateSidebarWidth()
  }

  async function fetchMemories() {
    isLoading.value = true
    const isFirstFetch = memories.value.length === 0
    try {
      const mem0Client = useMem0Client()
      if (!mem0Client) {
        memories.value = []
      } else {
        memories.value = await mem0Client.getAllMemories()
        if (isFirstFetch && memories.value.length > 0 && !isMobileView.value) {
          toggleSidebar();
        }
      }
    } catch (error) {
      console.error('Error fetching memories:', error)
      memories.value = []
    } finally {
      isLoading.value = false
    }
  }

  const deleteAllMemories = async () => {
    isLoading.value = true
    await new Promise((resolve) => setTimeout(resolve, 300))
    memories.value = []
    isLoading.value = false
  }

  const reversedMemories = computed(() => [...memories.value].reverse())

  const asideClasses = computed(() => {
    // For desktop
    if (!isMobileView.value) {
      const widthClass = isCollapsed.value ? 'w-10' : 'w-96'
      return `z-50 transition-[width] ease-in-out duration-300 ${widthClass} h-screen fixed top-0 right-0`
    }
    
    // For mobile - either full width in a drawer or hidden
    return props.isMobileOpen
      ? 'z-50 fixed inset-y-0 right-0 w-full sm:w-80 max-w-full h-screen transition-transform duration-300 translate-x-0 shadow-lg'
      : 'z-50 fixed inset-y-0 right-0 w-full sm:w-80 max-w-full h-screen transition-transform duration-300 translate-x-full'
  })

  const updateSidebarWidth = () => {
    if (isMobileView.value) {
      // On mobile, we don't adjust main content margin
      emit('collapse-change', 0)
    } else {
      // On desktop, adjust main content margin
      emit('collapse-change', isCollapsed.value ? 40 : 384)
    }
  }

  const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value
    updateSidebarWidth()
  }

  const closeMobileSidebar = () => {
    if (isMobileView.value) {
      emit('mobile-close')
    }
  }

  function selectMemory(memory: Memory) {
    if (selectedMemory.value?.id === memory.id) {
      // Force re-render by clearing first
      selectedMemory.value = null
      nextTick(() => {
        selectedMemory.value = memory
      })
    } else {
      selectedMemory.value = memory
    }
  }

  function handleMemoryUpdate(updated: Memory) {
    memories.value = memories.value.map((m) => m.id === updated.id ? updated : m)
    selectedMemory.value = null
  }

  function handleMemoryDelete(id: string) {
    memories.value = memories.value.filter((m) => m.id !== id)
    selectedMemory.value = null
  }

  // Watch for window resize
  if (process.client) {
    window.addEventListener('resize', updateWindowWidth)
    
    // Clean up event listener
    onUnmounted(() => {
      window.removeEventListener('resize', updateWindowWidth)
    })
  }

  // Watch for mobile open/close prop changes
  watch(() => props.isMobileOpen, (newVal) => {
    if (isMobileView.value) {
      updateSidebarWidth()
    }
  })

  onMounted(() => {
    updateWindowWidth() // Set initial viewport check
    userId.value = getUserId()
    if (userId.value) {
      fetchMemories()
    }
  })

  watch(
    () => [props.fetchTrigger, config.ai.mem0ApiKey],
    () => {
      if (userId.value) {
        const timeoutId = setTimeout(() => {
          fetchMemories()
        }, 3000)
        return () => clearTimeout(timeoutId)
      }
    }
  )
</script>