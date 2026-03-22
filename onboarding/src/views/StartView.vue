<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'
import { useOnboardingState } from '@/composables/useOnboardingState'

const router = useRouter()
const { setPath } = useOnboardingState()

function choose(path: 'newcomer' | 'experienced') {
  setPath(path)
  if (path === 'newcomer') {
    router.push({ name: 'info' })
  } else {
    router.push({ name: 'attestation' })
  }
}
</script>

<template>
  <div class="space-y-8">
    <h1 class="font-display text-3xl text-burn-cream">Онбординг Уральского бёрна</h1>
    <p class="text-burn-cream/90">
      Все участники проходят один поток: новички — обучение и аттестацию, те, у кого уже есть опыт бёрнов, — только аттестацию.
      В конце — электронный сертификат с уникальным кодом (можно скачать PDF), когда успешно пройдёшь аттестацию.
    </p>

    <p class="text-burn-cream/80 font-medium">Как тебе удобнее?</p>
    <div class="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        class="rounded-xl border-2 border-burn-orange bg-burn-card px-6 py-5 text-left transition hover:border-burn-orangeLight"
        @click="choose('newcomer')"
      >
        <span class="block font-semibold text-burn-cream">Я новичок в бёрн-культуре</span>
        <span class="mt-1 block text-sm text-burn-cream/80">Главы с мини-проверкой после каждой, затем аттестация</span>
      </button>
      <button
        type="button"
        class="rounded-xl border-2 border-burn-border bg-burn-card px-6 py-5 text-left transition hover:border-burn-orange/50"
        @click="choose('experienced')"
      >
        <span class="block font-semibold text-burn-cream">У меня уже есть опыт бёрнов / кемпов</span>
        <span class="mt-1 block text-sm text-burn-cream/80">Сразу аттестация (тест знаний + согласие)</span>
      </button>
    </div>

    <p class="text-sm text-burn-cream/60">
      <RouterLink to="/" class="underline">Вернуться на главную</RouterLink>
    </p>
  </div>
</template>
