<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ExpandedPrinciplesBlocks from '@/components/ExpandedPrinciplesBlocks.vue'
</script>

<template>
  <div class="space-y-8">
    <h1 class="font-display text-4xl sm:text-6xl text-burn-cream">10 принципов</h1>
    <ExpandedPrinciplesBlocks />

    <p class="text-sm text-burn-cream/60">
      <RouterLink to="/onboarding" class="underline">Перейти к обучению</RouterLink>
      <span class="mx-2">•</span>
      <RouterLink to="/" class="underline">На главную</RouterLink>
    </p>
  </div>
</template>
