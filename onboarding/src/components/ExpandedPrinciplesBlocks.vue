<script setup lang="ts">
import { expandedPrinciples } from '@/data/principlesExpanded'
</script>

<template>
  <div class="space-y-5">
    <article
      v-for="p in expandedPrinciples"
      :key="p.n"
      class="rounded-2xl border border-burn-border/90 bg-gradient-to-br from-burn-card to-burn-dark/90 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-7"
    >
      <div class="flex flex-col gap-5 sm:flex-row sm:gap-7">
        <div class="flex shrink-0 items-center gap-3 sm:w-[12rem] sm:flex-col sm:items-center sm:gap-4">
          <span class="font-display text-[3.2rem] leading-none text-burn-orange/95 tabular-nums sm:text-[4rem]">
            {{ String(p.n).padStart(2, '0') }}
          </span>
          <div
            class="flex h-[6.5rem] w-[6.5rem] items-center justify-center rounded-2xl border border-burn-orange/30 bg-burn-dark/55 p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:h-[8.4rem] sm:w-[8.4rem]"
          >
            <img :src="p.symbol" :alt="''" class="h-full w-full object-contain opacity-95" loading="lazy" decoding="async">
          </div>
        </div>

        <div class="min-w-0 flex-1 border-l border-burn-orange/25 pl-4 sm:pl-6">
          <h2 class="font-quote text-[1.75rem] font-semibold italic leading-tight text-burn-cream sm:text-[2.2rem]">
            «{{ p.title }}»
          </h2>
          <p
            class="mt-3 inline-block rounded-md border border-burn-orange/30 bg-burn-orange/10 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-burn-orange/95 sm:text-base"
          >
            {{ p.summary }}
          </p>
          <p class="mt-3 text-base leading-relaxed text-burn-cream/78 sm:text-lg">{{ p.details }}</p>
        </div>
      </div>
    </article>
  </div>
</template>
