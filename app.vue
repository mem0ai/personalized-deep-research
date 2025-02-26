<template>
  <UApp :locale="zh_cn">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
  import { zh_cn } from '@nuxt/ui/locale'

  useHead({
    title: 'Deep Research (powered by mem0)',
    meta: [
      // Primary Meta Tags
      { name: 'title', content: 'Deep Research (powered by mem0)' },
      { name: 'description', content: 'Advanced deep research leveraging mem0 to create highly tailored reports designed just for you. Get in-depth deep research reports optimized for your needs.' },

      // Open Graph / Facebook
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://deep-research.mem0.ai' },
      { property: 'og:title', content: 'Deep Research (powered by mem0)' },
      { property: 'og:description', content: 'Advanced deep research leveraging mem0 to create highly tailored reports designed just for you. Get in-depth deep research reports optimized for your needs.' },

      // Twitter
      { name: 'twitter:url', content: 'https://deep-research.mem0.ai' },
      { name: 'twitter:title', content: 'Deep Research (powered by mem0)' },
      { name: 'twitter:description', content: 'Advanced deep research leveraging mem0 to create highly tailored reports designed just for you. Get in-depth deep research reports optimized for your needs.' },
    ]
  });
</script>
