<script setup lang="ts">
  import { marked } from 'marked'
  import { writeFinalReport } from '~/lib/deep-research'
  import jsPDF from 'jspdf'
  import {
    feedbackInjectionKey,
    formInjectionKey,
    researchResultInjectionKey,
  } from '~/constants/injection-keys'

  const { t, locale } = useI18n()
  const toast = useToast()

  const error = ref('')
  const loading = ref(false)
  const loadingExportPdf = ref(false)
  const loadingExportMarkdown = ref(false)
  const reasoningContent = ref('')
  const reportContent = ref('')

  // Inject global data from index.vue
  const form = inject(formInjectionKey)!
  const feedback = inject(feedbackInjectionKey)!
  const researchResult = inject(researchResultInjectionKey)!

  const reportHtml = computed(() =>
    marked(reportContent.value, { silent: true, gfm: true, breaks: true }),
  )
  const isExportButtonDisabled = computed(
    () =>
      !reportContent.value ||
      loading.value ||
      loadingExportPdf.value ||
      loadingExportMarkdown.value,
  )
  let pdf: jsPDF | undefined

  async function generateReport() {
    loading.value = true
    error.value = ''
    reportContent.value = ''
    reasoningContent.value = ''
    try {
      // Store a copy of the data
      const visitedUrls = researchResult.value.visitedUrls ?? []
      const learnings = researchResult.value.learnings ?? []
      const fullStream = await writeFinalReport({
        prompt: getCombinedQuery(form.value, feedback.value),
        language: t('language', {}, { locale: locale.value }),
        learnings,
      })
      for await (const chunk of fullStream) {
        if (chunk.type === 'reasoning') {
          reasoningContent.value += chunk.textDelta
        } else if (chunk.type === 'text-delta') {
          reportContent.value += chunk.textDelta
        } else if (chunk.type === 'error') {
          error.value = t('researchReport.error', [
            chunk.error instanceof Error
              ? chunk.error.message
              : String(chunk.error),
          ])
        }
      }
      reportContent.value += `\n\n## ${t(
        'researchReport.sources',
      )}\n\n${visitedUrls.map((url) => `- ${url}`).join('\n')}`
    } catch (e: any) {
      console.error(`Generate report failed`, e)
      error.value = t('researchReport.error', [e.message])
    } finally {
      loading.value = false
    }
  }

  async function exportToPdf() {
    const element = document.getElementById('report-content')
    if (!element) return

    loadingExportPdf.value = true

    try {
      // 创建 PDF 实例
      if (!pdf) {
        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        })
      }

      // Load Chinese font
      if (locale.value === 'zh') {
        try {
          if (!pdf.getFontList().SourceHanSans?.length) {
            toast.add({
              title: t('researchReport.downloadingFonts'),
              duration: 5000,
              color: 'info',
            })
            // Wait for 100ms to avoid toast being blocked by PDF generation
            await new Promise((resolve) => setTimeout(resolve, 100))
            const fontUrl = '/fonts/SourceHanSansCN-VF.ttf'
            pdf.addFont(fontUrl, 'SourceHanSans', 'normal')
            pdf.setFont('SourceHanSans')
          }
        } catch (e: any) {
          toast.add({
            title: t('researchReport.downloadFontFailed'),
            description: e.message,
            duration: 8000,
            color: 'error',
          })
          console.warn(
            'Failed to load Chinese font, fallback to default font:',
            e,
          )
        }
      }

      // 设置字体大小和行高
      const fontSize = 10.5
      const lineHeight = 1.5
      pdf.setFontSize(fontSize)

      // 设置页面边距（单位：mm）
      const margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      }

      // 获取纯文本内容
      const content = element.innerText

      // 计算可用宽度（mm）
      const pageWidth = pdf.internal.pageSize.getWidth()
      const maxWidth = pageWidth - margin.left - margin.right

      // 分割文本为行
      const lines = pdf.splitTextToSize(content, maxWidth)

      // 计算当前位置
      let y = margin.top

      // 逐行添加文本
      for (const line of lines) {
        // 检查是否需要新页
        if (y > pdf.internal.pageSize.getHeight() - margin.bottom) {
          pdf.addPage()
          y = margin.top
        }

        // 添加文本
        pdf.text(line, margin.left, y)
        y += fontSize * lineHeight
      }

      pdf.save('research-report.pdf')
    } catch (error) {
      console.error('Export to PDF failed:', error)
    } finally {
      loadingExportPdf.value = false
    }
  }

  async function exportToMarkdown() {
    if (!reportContent.value) return

    loadingExportMarkdown.value = true
    try {
      const blob = new Blob([reportContent.value], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'research-report.md'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export to Markdown failed:', error)
    } finally {
      loadingExportMarkdown.value = false
    }
  }

  defineExpose({
    generateReport,
    exportToPdf,
    exportToMarkdown,
  })
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="font-bold">{{ $t('researchReport.title') }}</h2>
        <UButton
          icon="i-lucide-refresh-cw"
          :loading
          variant="ghost"
          @click="generateReport"
        >
          {{ $t('researchReport.regenerate') }}
        </UButton>
      </div>
    </template>

    <div v-if="error" class="text-red-500">{{ error }}</div>

    <div class="flex mb-4 justify-end">
      <UButton
        color="info"
        variant="ghost"
        icon="i-lucide-download"
        size="sm"
        :disabled="isExportButtonDisabled"
        :loading="loadingExportMarkdown"
        @click="exportToMarkdown"
      >
        {{ $t('researchReport.exportMarkdown') }}
      </UButton>
      <UButton
        color="info"
        variant="ghost"
        icon="i-lucide-download"
        size="sm"
        :disabled="isExportButtonDisabled"
        :loading="loadingExportPdf"
        @click="exportToPdf"
      >
        {{ $t('researchReport.exportPdf') }}
      </UButton>
    </div>

    <ReasoningAccordion
      v-if="reasoningContent"
      v-model="reasoningContent"
      class="mb-4"
      :loading="loading"
    />

    <div
      v-if="reportContent"
      id="report-content"
      class="prose prose-sm max-w-none break-words p-6 bg-gray-50 dark:bg-zinc-800 dark:prose-invert dark:text-white rounded-lg shadow"
      v-html="reportHtml"
    />
    <div v-else>
      {{
        loading ? $t('researchReport.generating') : $t('researchReport.waiting')
      }}
    </div>
  </UCard>
</template>
