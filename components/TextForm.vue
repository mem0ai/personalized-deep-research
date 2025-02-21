<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useMem0Client } from '~/lib/mem0'
import * as pdfjsLib from 'pdfjs-dist'

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

// Reactive refs for PDF file and preview URL.
const pdfFile = ref<File | null>(null)
const pdfPreviewUrl = ref<string>('')

// Control modal visibility for PDF preview.
const isPreviewVisible = ref(false)

const isLoading = ref(false)
const emit = defineEmits<{ (e: 'submit', parsedText: string): void }>()

// Reference to the hidden file input.
const fileInput = ref<HTMLInputElement | null>(null)

// Disable the submit button if no file is selected.
const isSubmitDisabled = computed(() => pdfFile.value === null)

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files[0]) {
    pdfFile.value = files[0]
    pdfPreviewUrl.value = URL.createObjectURL(files[0])
  } else {
    pdfFile.value = null
    pdfPreviewUrl.value = ''
  }
}

function openPreview() {
  if (!pdfFile.value) {
    console.error("No PDF file selected.")
    return
  }
  parsePDF(pdfFile.value);
  isPreviewVisible.value = true
}

function closePreview() {
  isPreviewVisible.value = false
}

// Close the modal when Esc is pressed.
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closePreview()
  }
}

watch(isPreviewVisible, (visible) => {
  if (visible) {
    window.addEventListener('keydown', handleKeyDown)
  } else {
    window.removeEventListener('keydown', handleKeyDown)
  }
})

// Cleanup on component unmount.
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

async function parsePDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result;
        if (!arrayBuffer) {
          reject(new Error("Failed to read file"));
          return;
        }
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          let pageText = "";
          let lastY: number | null = null;
          content.items.forEach((item: any) => {
            const y = item.transform[5];
            // if the vertical difference is significant, start a new line
            if (lastY !== null && Math.abs(y - lastY) > 5) {
              pageText += "\n";
            } else if (lastY !== null) {
              // otherwise, add a space between words
              pageText += " ";
            }
            pageText += item.str;
            lastY = y;
          });
          fullText += pageText + "\n";
        }
        console.log("Parsed text:", fullText);
        resolve(fullText);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

async function handleSubmit() {
  try {
    isLoading.value = true
    if (!pdfFile.value) {
      console.error("No PDF file selected.")
      return
    }
    const parsedText = await parsePDF(pdfFile.value)
    const mem0Client = useMem0Client()
    const saveToMem0: (text: string) => Promise<any> =
      mem0Client?.saveToMem0 ||
      (async (text: string) => {
        console.error('Mem0 client is not available, cannot save to Mem0')
      })
    await saveToMem0(parsedText)
    emit('submit', parsedText)
  } catch (error) {
    console.error('Error submitting resume:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-bold">1. Submit Your Resume (PDF)</h2>
    </template>

    <div class="flex flex-col gap-2">
      <UFormField label="Upload PDF" required>
        <!-- Hidden file input -->
        <input
          ref="fileInput"
          type="file"
          accept="application/pdf"
          @change="handleFileChange"
          style="display: none;"
        />
        <!-- Styled button to trigger file input -->
        <UButton @click="triggerFileInput" variant="solid">
          Choose File
        </UButton>
        <!-- Display selected file name -->
        <span v-if="pdfFile" class="ml-2 text-sm">{{ pdfFile.name }}</span>
      </UFormField>

      <!-- Show "View PDF" button only after a file is selected -->
      <div v-if="pdfFile">
        <UButton variant="outline" @click="openPreview">
          View PDF
        </UButton>
      </div>
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

    <UModal v-model:open="isPreviewVisible" title="PDF Preview">
      <template #body>
        <object :data="pdfPreviewUrl" type="application/pdf" width="100%" height="600">
          <p>
            Your browser does not support PDFs.
            <a :href="pdfPreviewUrl" target="_blank">Download PDF</a>.
          </p>
        </object>
      </template>
    </UModal>
  </UCard>
</template>
