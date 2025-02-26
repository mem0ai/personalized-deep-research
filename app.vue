<template>
  <UApp :locale="zh_cn">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Analytics />
  </UApp>
</template>

<script setup lang="ts">
  import { zh_cn } from '@nuxt/ui/locale'
  import { Analytics } from '@vercel/analytics/nuxt'

  useHead({
    title: 'Personalized Deep Research (Powered by Mem0)',
    meta: [
      // Primary Meta Tags
      { name: 'title', content: 'Personalized Deep Research (Powered by Mem0)' },
      { name: 'description', content: 'Advanced deep research leveraging mem0 to create highly tailored reports designed just for you. Get in-depth deep research reports optimized for your needs.' },

      // Open Graph / Facebook
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://deep-research.mem0.ai' },
      { property: 'og:title', content: 'Personalized Deep Research (Powered by Mem0)' },
      { property: 'og:description', content: 'Advanced deep research leveraging mem0 to create highly tailored reports designed just for you. Get in-depth deep research reports optimized for your needs.' },

      // Twitter
      { name: 'twitter:url', content: 'https://deep-research.mem0.ai' },
      { name: 'twitter:title', content: 'Personalized Deep Research (Powered by Mem0)' },
      { name: 'twitter:description', content: 'Advanced deep research leveraging mem0 to create highly tailored reports designed just for you. Get in-depth deep research reports optimized for your needs.' },
    ]
  });
</script>
