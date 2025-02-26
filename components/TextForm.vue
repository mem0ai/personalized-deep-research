<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useMem0Client } from '~/lib/mem0'
import * as pdfjsLib from 'pdfjs-dist'

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

// Reactive refs for PDF file and preview URL.
const pdfFile = ref<File | null>(null)
const pdfPreviewUrl = ref<string>('')

// New: Reactive ref for manual text input
const manualText = ref<string>('')

// Control modal visibility for PDF preview.
const isPreviewVisible = ref(false)

const isLoading = ref(false)
const emit = defineEmits<{
  (e: 'submitForm'): void;
  (e: 'openConfig'): void;
}>()

// Reference to the hidden file input.
const fileInput = ref<HTMLInputElement | null>(null)

// Enable submission if a PDF is selected OR manual text is non-empty.
const isSubmitDisabled = computed(() =>
  pdfFile.value === null && manualText.value.trim() === ''
)

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
  // Parse PDF for preview (you may or may not want to use its result here)
  parsePDF(pdfFile.value)
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
    isLoading.value = true;
    console.log(manualText.value.trim());
    if (!pdfFile.value && !manualText.value.trim()) {
      console.error("No PDF file or manual text provided.");
      return
    }
    const mem0Client = useMem0Client();
    if (!mem0Client) {
      console.error('Mem0 client is not available, cannot save to Mem0');
      emit('openConfig');
      return;
    }
    const saveToMem0: (text: string) => Promise<any> =
      mem0Client?.saveToMem0 ||
      (async (text: string) => {
        console.error('Mem0 client is not available, cannot save to Mem0')
      });

    let results: string[] = [];

    // If a PDF file is provided, parse and save it.
    if (pdfFile.value) {
      const parsedText = await parsePDF(pdfFile.value);
      await saveToMem0(parsedText);
      results.push(parsedText);
    }
    // If manual text is provided, save it as well.
    if (manualText.value.trim()) {
      const manual = manualText.value;
      await saveToMem0(manual);
      results.push(manual);
    }

    // Emit the combined result (or you could emit separately as needed)
    emit('submitForm');
  } catch (error) {
    console.error('Error submitting resume or text:', error);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-bold">1. Begin Your Journey - Upload Your Resume for Personalization (pdf or text)</h2>
    </template>

    <div class="flex flex-col gap-2">
      <!-- PDF Upload Field -->
      <UFormField label="Upload PDF">
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

      <!-- Optional: View PDF button -->
      <div v-if="pdfFile">
        <UButton variant="outline" @click="openPreview">
          View PDF
        </UButton>
      </div>

      <!-- New: Manual Text Input Field -->
      <UFormField class="pt-2.5" label="Or enter something about yourself manually">
        <UTextarea
          class="w-full"
          v-model="manualText"
          :rows="3"
          placeholder="Eg. Paste your resume here..."
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
