<template>
    <div
      class="group flex flex-col justify-between items-start text-primary p-4 cursor-pointer hover:bg-[#252c40] hover:shadow-md rounded-md mb-2 border-t border-gray-300 transition-all duration-200"
      aria-haspopup="dialog"
      aria-expanded="false"
    >
      <!-- Memory Text (clamped to 2 lines) -->
      <div class="text-sm mb-2 line-clamp-2">
        {{ memory.memory }}
      </div>
      <!-- Timestamp with clock icon -->
      <div class="flex items-center text-xs text-muted-foreground mb-2">
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
          class="lucide lucide-clock w-3 h-3 mr-1"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>{{ formatDate(memory.updated_at) }}</span>
      </div>
      <!-- Categories badges -->
      <div class="flex flex-wrap gap-2">
        <div
          v-for="category in memory.categories"
          :key="category"
          class="inline-flex items-center rounded-md border border-gray-300 px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs"
        >
          {{ category }}
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { defineProps } from 'vue'
  interface Memory {
    id: string
    memory: string
    updated_at: string
    categories: string[]
  }
  const props = defineProps<{ memory: Memory }>()
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  </script>
  
  <style scoped>
  /* Utility for clamping text to 2 lines */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  </style>
