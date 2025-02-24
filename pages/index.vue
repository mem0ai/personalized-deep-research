<template>
  <div class="min-h-screen relative">
    <!-- Mobile Header - Only visible on mobile -->
    <div class="lg:hidden sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <h1 class="text-xl font-bold flex items-center gap-1">
          Deep Research
          <span class="text-xs text-gray-400 dark:text-gray-500">v{{ version }}</span>
        </h1>
        <div class="flex items-center gap-2">
          <button 
            @click="toggleMobileSidebar" 
            class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle Sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
          <ColorModeButton />
        </div>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row">
      <!-- Main Content -->
      <div 
        class="flex-1 h-screen max-h-screen overflow-y-auto transition-all duration-300" 
        :style="{ marginRight: sidebarWidth + 'px' }"
      >
        <UContainer>
          <div class="max-w-4xl mx-auto py-4 lg:py-8 flex flex-col gap-y-4 px-4 sm:px-6">
            <!-- Desktop Header - hidden on mobile -->
            <div class="hidden lg:flex flex-col sm:flex-row gap-2">
              <h1 class="text-3xl font-bold text-center mb-2">
                Deep Research
                <span class="text-xs text-gray-400 dark:text-gray-500">
                  v{{ version }}
                </span>
              </h1>
              <div class="mx-auto sm:ml-auto sm:mr-0 flex items-center gap-2">
                <GitHubButton />
                <ConfigManager ref="configManagerRef" />
                <ColorModeButton />
                <LangSwitcher />
              </div>
            </div>

            <!-- Secondary Mobile Controls - only visible on mobile -->
            <div class="flex lg:hidden items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <GitHubButton />
                <ConfigManager ref="configManagerRef" />
              </div>
              <LangSwitcher />
            </div>

            <i18n-t
              class="whitespace-pre-wrap text-sm sm:text-base"
              keypath="index.projectDescription"
              tag="p"
            >
              <UButton
                class="!p-0"
                variant="link"
                href="https://github.com/dzhng/deep-research"
                target="_blank"
              >
                dzhng/deep-research
              </UButton>
            </i18n-t>

            <TextForm @submit="onTextFormSubmit" />
            <ResearchForm
              :is-loading-feedback="!!feedbackRef?.isLoading"
              ref="formRef"
              @submit="generateFeedback"
            />
            <ResearchFeedback
              :is-loading-search="!!deepResearchRef?.isLoading"
              ref="feedbackRef"
              @submit="startDeepSearch"
            />
            <DeepResearch ref="deepResearchRef" @complete="generateReport" />
            <ResearchReport ref="reportRef" />
          </div>
        </UContainer>
      </div>

      <!-- Sidebar - For both desktop and mobile with different behavior -->
      <MemorySidebar 
        :trigger="sidebarTrigger" 
        :fetchTrigger="memoryFetchTrigger"
        :is-mobile-open="isMobileSidebarOpen"
        @collapse-change="updateSidebarWidth"
        @mobile-close="closeMobileSidebar"
      />
    </div>
    <AutoUpdateToast />
  </div>
</template>

<script setup lang="ts">
  import { ref, provide, onMounted } from 'vue'
  import type ResearchForm from '~/components/ResearchForm.vue'
  import type TextForm from '~/components/TextForm.vue'
  import type ResearchFeedback from '~/components/ResearchFeedback.vue'
  import type DeepResearch from '~/components/DeepResearch/DeepResearch.vue'
  import type ResearchReport from '~/components/ResearchReport.vue'
  import type ConfigManager from '~/components/ConfigManager.vue'
  import type { ResearchInputData } from '~/components/ResearchForm.vue'
  import type { ResearchFeedbackResult } from '~/components/ResearchFeedback.vue'
  import type { ResearchResult } from '~/lib/deep-research'
  import {
    feedbackInjectionKey,
    formInjectionKey,
    researchResultInjectionKey,
  } from '~/constants/injection-keys'
  import MemorySidebar from '~/components/MemorySidebar.vue'

  const version = useRuntimeConfig().public.version

  // Explicitly typed refs:
  const configManagerRef = ref<InstanceType<typeof ConfigManager>>()
  const formRef = ref<InstanceType<typeof ResearchForm>>()
  const feedbackRef = ref<InstanceType<typeof ResearchFeedback>>()
  const deepResearchRef = ref<InstanceType<typeof DeepResearch>>()
  const reportRef = ref<InstanceType<typeof ResearchReport>>()
  const { config } = useConfigStore()

  // Responsive state
  const isMobileSidebarOpen = ref(false)
  const sidebarWidth = ref(0) // Will be updated based on screen size

  const form = ref<ResearchInputData>({
    query: '',
    numQuestions: config.ai.numQuestions,
    depth: config.ai.depth,
    breadth: config.ai.breadth,
  })
  const feedback = ref<ResearchFeedbackResult[]>([])
  const researchResult = ref<ResearchResult>({
    learnings: [],
    visitedUrls: [],
  })

  watchEffect(() => {
    form.value.numQuestions = config.ai.numQuestions;
    form.value.depth = config.ai.depth;
    form.value.breadth = config.ai.breadth;
  });

  provide(formInjectionKey, form)
  provide(feedbackInjectionKey, feedback)
  provide(researchResultInjectionKey, researchResult)

  async function generateFeedback() {
    feedbackRef.value?.getFeedback()
  }

  async function startDeepSearch() {
    deepResearchRef.value?.startResearch()
  }

  async function generateReport() {
    reportRef.value?.generateReport()
  }

  // A reactive trigger for the sidebar refresh (pass as prop)
  const sidebarTrigger = ref(false)
  const memoryFetchTrigger = ref(false)

  function updateSidebarWidth(width: number) {
    sidebarWidth.value = width
  }

  function toggleMobileSidebar() {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen.value = false
  }

  function onTextFormSubmit(resume: string) {
    // Toggle so that MemorySidebar's watcher detects a change.
    memoryFetchTrigger.value = !memoryFetchTrigger.value
  }

  // Initialize on mount
  onMounted(() => {
    // Set initial sidebar width based on screen size
    if (window.innerWidth >= 1024) {
      // Desktop - start with collapsed sidebar (40px)
      updateSidebarWidth(40)
    } else {
      // Mobile - no sidebar margin initially
      updateSidebarWidth(0)
    }
  })
</script>

<style scoped>
@media (max-width: 1023px) {
  .min-h-screen {
    min-height: 100vh;
  }
}
</style>