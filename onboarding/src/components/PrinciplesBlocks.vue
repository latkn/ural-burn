<script setup lang="ts">
import type { PrincipleBlock } from '@/data/chapters'

defineProps<{
  blocks: PrincipleBlock[]
}>()
</script>

<template>
  <div class="mt-8 space-y-5">
    <article
      v-for="p in blocks"
      :key="p.n"
      class="rounded-2xl border border-burn-border/90 bg-gradient-to-br from-burn-card to-burn-dark/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
    >
      <div class="flex gap-3 p-5 sm:gap-6 sm:p-7">
        <div
          class="flex w-[7.75rem] shrink-0 items-center justify-center gap-2 self-center sm:w-[9.25rem] sm:gap-3"
          aria-hidden="true"
        >
          <span
            class="font-display text-[3.6rem] leading-none tracking-tight text-burn-orange/95 tabular-nums sm:text-[4.2rem]"
          >
            {{ String(p.n).padStart(2, '0') }}
          </span>
          <div
            v-if="p.symbol"
            class="flex h-[4.9rem] w-[4.9rem] items-center justify-center rounded-2xl border border-burn-orange/25 bg-burn-dark/55 p-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:h-[6rem] sm:w-[6rem]"
          >
            <img :src="p.symbol" :alt="''" class="h-full w-full object-contain opacity-95" loading="lazy" decoding="async">
          </div>
        </div>
        <div class="min-w-0 flex-1 border-l border-burn-orange/25 pl-4 sm:pl-6">
          <blockquote
            class="font-quote text-[1.35rem] font-semibold italic leading-snug text-burn-cream sm:text-[1.55rem] sm:leading-tight"
          >
            «{{ p.title }}»
          </blockquote>
          <p class="mt-3 text-lg leading-relaxed text-burn-cream/82 sm:text-xl">
            {{ p.text }}
          </p>
        </div>
      </div>
    </article>
  </div>
</template>
