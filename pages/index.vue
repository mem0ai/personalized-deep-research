<template>
  <div class="min-h-screen relative">
    <!-- Mobile Header - Only visible on mobile -->
    <div class="lg:hidden sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <h1 class="text-xl font-bold flex items-center gap-1">
          Deep Research
        </h1>
        <div class="flex items-center gap-2">
          <button 
            @click="toggleMobileSidebar" 
            class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
            aria-label="Toggle Sidebar"
          >
            <UIcon name="i-lucide-brain" size="24" class="inline-flex" />
          </button>
          <ColorModeButton />
        </div>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row">
      <!-- Main Content -->
      <div 
        class="flex-1 h-screen max-h-[calc(100vh-64px)] lg:max-h-screen overflow-y-auto transition-all duration-300" 
        :style="{ marginRight: sidebarWidth + 'px' }"
      >
        <UContainer>
          <div class="max-w-4xl mx-auto py-4 lg:py-8 flex flex-col gap-y-4 px-4 sm:px-6">
            <!-- Desktop Header - hidden on mobile -->
            <div class="hidden lg:flex flex-col sm:flex-row gap-2">
              <h1 class="text-3xl font-bold text-center mb-2">
                Deep Research
                <span class="inline-flex gap-1 text-xs text-gray-400 dark:text-gray-500">
                    powered by 
                    <a href="https://mem0.ai" target="_blank" class="inline dark:hidden">
                      <img src="public/light.svg" alt="Mem0" class="h-4 pb-[2px]" />
                    </a>
                    <a href="https://mem0.ai" target="_blank" class="hidden dark:inline">
                      <img src="public/dark.svg" alt="Mem0" target="_blank" class="h-4 pb-[2px]" />
                    </a>
                </span>
              </h1>
              <div class="mx-auto sm:ml-auto sm:mr-0 flex items-center gap-2">
                <GitHubButton />
                <ConfigManager ref="configManagerRef" />
                <ColorModeButton />
              </div>
            </div>

            <!-- Secondary Mobile Controls - only visible on mobile -->
            <div class="flex lg:hidden items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <GitHubButton />
                <ConfigManager ref="configManagerRef" />
              </div>
            </div>

            <i18n-t
              class="whitespace-pre-wrap text-sm sm:text-base"
              keypath="index.projectDescription"
              tag="p"
            >
              <template v-slot:deep-research>
                <UButton
                  class="!p-0 text-blue-500 underline"
                  variant="link"
                  href="https://github.com/dzhng/deep-research"
                  target="_blank"
                >
                  dzhng/deep-research
                </UButton>
              </template>

              <template v-slot:mem0>
                <UButton
                  class="!p-0 text-blue-500 underline"
                  variant="link"
                  href="https://mem0.ai"
                  target="_blank"
                >
                  mem0
                </UButton>
              </template>
            </i18n-t>

            <TextForm @submit-form="onTextFormSubmit" @open-config="openConfigManager" />
            <ResearchForm
              :is-loading-feedback="!!feedbackRef?.isLoading"
              ref="formRef"
              @submit="generateFeedback"
            />
            <ResearchFeedback
              v-if="currentStep >= 2"
              :is-loading-search="!!deepResearchRef?.isLoading"
              ref="feedbackRef"
              @submit="startDeepSearch"
            />
            <DeepResearch v-if="currentStep >= 3" ref="deepResearchRef" @complete="generateReport" />
            <ResearchReport v-if="currentStep >= 4" ref="reportRef" />
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
        @open-config="openConfigManager"
      />
    </div>
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

  // Define reactive state for the current step.
  // 1 = only form visible, 2 = form + feedback, 3 = form + feedback + deep research, 4 = all visible.
  const currentStep = ref(1)

  // Responsive state
  const isMobileSidebarOpen = ref(false)

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
    if (currentStep.value === 1) {
      currentStep.value = 2
      await nextTick();
    }
    await feedbackRef.value?.getFeedback()
  }

  async function startDeepSearch() {
    if (currentStep.value === 2) {
      currentStep.value = 3
      await nextTick();
    }
    await deepResearchRef.value?.startResearch()
  }

  async function generateReport() {
    if (currentStep.value === 3) {
      currentStep.value = 4
      await nextTick();
    }
    await reportRef.value?.generateReport()
  }

  // A reactive trigger for the sidebar refresh (pass as prop)
  const sidebarTrigger = ref(false)
  const memoryFetchTrigger = ref(false)

  // This reactive variable holds the current width of the sidebar (in pixels)
  const sidebarWidth = ref(0)

  function updateSidebarWidth(width: number) {
    sidebarWidth.value = width
  }

  function toggleMobileSidebar() {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen.value = false
  }

  function onTextFormSubmit() {
    memoryFetchTrigger.value = !memoryFetchTrigger.value
  }

  function openConfigManager() {
    configManagerRef.value?.show()
  }

  // Initialize on mount
  onMounted(() => {
    // Set initial sidebar width based on screen size
    if (window.innerWidth >= 1024) {
      // Desktop - start with collapsed sidebar (40px)
      updateSidebarWidth(384)
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