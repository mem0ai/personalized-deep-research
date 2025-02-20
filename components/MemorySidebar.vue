<template>
    <aside :class="asideClasses">
      <!-- Collapse toggle button -->
      <div
        class="absolute inset-x-0 top-1/2 transform -translate-y-1/2 -left-4 z-20"
      >
        <button
          class="toggle-btn"
          @click="toggleSidebar"
          :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="{ '-rotate-180': isCollapsed, 'rotate-0': !isCollapsed }"
            class="chevron-icon"
          >
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </button>
      </div>
  
      <!-- Only show content when not collapsed -->
      <div v-if="!isCollapsed">
        <!-- Header -->
        <div class="flex justify-between items-center p-2 pl-4">
          <div class="flex flex-1 items-center gap-2">
            <h2 class="text-med pr-2 font-semibold">
              Your Memories ({{ memories.length }})
            </h2>
          </div>
          <div class="flex justify-end gap-2">
            <button
              class="action-btn"
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
              >
                <path
                  d="M1.84998 7.49998C1.84998 4.66458 4.05979 1.84998 7.49998 1.84998C10.2783 1.84998 11.6515 3.9064 12.2367 5H10.5C10.2239 5 10 5.22386 10 5.5C10 5.77614 10.2239 6 10.5 6H13.5C13.7761 6 14 5.77614 14 5.5V2.5C14 2.22386 13.7761 2 13.5 2C13.2239 2 13 2.22386 13 2.5V4.31318C12.2955 3.07126 10.6659 0.849976 7.49998 0.849976C3.43716 0.849976 0.849976 4.18537 0.849976 7.49998C0.849976 10.8146 3.43716 14.15 7.49998 14.15C9.44382 14.15 11.0622 13.3808 12.2145 12.2084C12.8315 11.5806 13.3133 10.839 13.6418 10.0407C13.7469 9.78536 13.6251 9.49315 13.3698 9.38806C13.1144 9.28296 12.8222 9.40478 12.7171 9.66014C12.4363 10.3425 12.0251 10.9745 11.5013 11.5074C10.5295 12.4963 9.16504 13.15 7.49998 13.15C4.05979 13.15 1.84998 10.3354 1.84998 7.49998Z"
                  fill="currentColor"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </button>
            <button
              class="action-btn"
              @click="deleteAllMemories"
              :disabled="isLoading"
              title="Delete All Memories"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
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
        <div class="memory-list" dir="ltr">
          <div v-if="memories.length > 0">
            <div v-for="memory in reversedMemories" 
                 :key="memory.id" 
                 class="memory-item p-4 border-b">
              <div class="memory-content mb-2">{{ memory.memory }}</div>
              <div class="memory-categories flex gap-2 mb-1">
                <span v-for="category in memory.categories" 
                      :key="category" 
                      class="category-tag bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600">
                  {{ category }}
                </span>
              </div>
              <div class="text-xs text-gray-500">
                {{ new Date(memory.updated_at).toLocaleString() }}
              </div>
            </div>
          </div>
          <p v-else class="mt-4 text-center text-gray-600">
            No memories found. Your memories will appear here.
          </p>
        </div>
      </div>
    </aside>
  </template>
  
  <script setup lang="ts">
    import {
      ref,
      computed,
      onMounted,
      watch,
      defineEmits,
      defineProps,
    } from 'vue'
    import { getAllMemories } from '../lib/mem0'
    interface Memory {
      id: string
      memory: string
      user_id: string
      metadata: any
      categories: string[]
      created_at: string
      updated_at: string
    }
    // Props: trigger (to refresh memories on change)
    const props = defineProps<{ trigger: boolean }>()
    // Emit collapse-change event with the current sidebar width (in pixels)
    const emit = defineEmits<{ (e: 'collapse-change', width: number): void }>()
    // Component state
    const isCollapsed = ref(false)
    const isLoading = ref(false)
    const memories = ref<Memory[]>([])
    const userId = ref<string>('')
    // Dummy function to simulate obtaining a user ID
    const getUserId = (): string => 'dummyUserId'
    // Simulate fetching memories with getAllMemories function
    const fetchMemories = async () => {
      isLoading.value = true
      try {
        memories.value = await getAllMemories()
      } catch (error) {
        console.error('Error fetching memories:', error)
        memories.value = []
      } finally {
        isLoading.value = false
      }
    }
    // Simulate deleting all memories
    const deleteAllMemories = async () => {
      isLoading.value = true
      await new Promise((resolve) => setTimeout(resolve, 300))
      memories.value = []
      isLoading.value = false
    }
    // Computed property for reversed memories
    const reversedMemories = computed(() => [...memories.value].reverse())
    // Compute aside element classes – fixed on large screens with full height.
    const asideClasses = computed(() => {
      const widthClass = isCollapsed.value ? 'w-10' : 'w-96'
      return `memories pt-2.5 z-50 transition-[width] ease-in-out duration-300 ${widthClass} h-screen lg:fixed lg:top-0 lg:right-0`
    })
    // Toggle the sidebar and emit the new width.
    const toggleSidebar = () => {
      isCollapsed.value = !isCollapsed.value
      emit('collapse-change', isCollapsed.value ? 40 : 384)
    }
    onMounted(() => {
      userId.value = getUserId()
      if (userId.value) {
        fetchMemories()
      }
    })
    // Watch for changes in the trigger prop to refresh memories after a delay
    watch(
      () => props.trigger,
      () => {
        if (userId.value) {
          const timeoutId = setTimeout(() => {
            fetchMemories()
          }, 3000)
          return () => clearTimeout(timeoutId)
        }
      },
    )
  </script>
  
  <style scoped>
    .memories {
      /* No explicit background so it blends with the page */
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
    }
    /* Toggle button styles */
    .toggle-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border: 1px solid #d1d5db;
      background-color: #111729;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .toggle-btn:hover {
      background-color: #252c40;
    }
    .chevron-icon {
      transition: transform 0.5s ease-in-out;
    }
    /* Action button styles */
    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border: 1px solid #d1d5db;
      background-color: transparent;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
    }
    .action-btn:hover {
      background-color: #252c40;
    }
    .icon {
      width: 1rem;
      height: 1rem;
    }
    /* Memory list styling */
    .memory-list {
      max-height: 100%;
      overflow-y: auto;
      padding: 0.5rem;
    }
    .memory-item {
      transition: background-color 0.2s;
    }
    .memory-item:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
    .memory-content {
      line-height: 1.5;
    }
    .category-tag {
      transition: background-color 0.2s;
    }
    .category-tag:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
  </style>
