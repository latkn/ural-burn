<script setup lang="ts">
import { RouterView, useRoute, RouterLink } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const isLanding = computed(() => route.name === 'landing')
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- На лендинге свой layout без шапки онбординга -->
    <template v-if="!isLanding">
      <header class="border-b border-burn-border py-4 px-4">
        <div class="container max-w-2xl mx-auto flex items-center justify-between">
          <RouterLink to="/" class="font-display text-xl text-burn-cream">Уральский бёрн</RouterLink>
          <span class="text-sm text-burn-muted">Онбординг</span>
        </div>
      </header>
      <main class="flex-1 container max-w-2xl mx-auto px-4 py-8">
        <RouterView />
      </main>
    </template>
    <template v-else>
      <RouterView />
    </template>
  </div>
</template>
