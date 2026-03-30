<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'
import { useOnboardingState } from '@/composables/useOnboardingState'
import FormattedBody from '@/components/FormattedBody.vue'

const router = useRouter()

const introText = `Нам важно, чтобы каждый участник был с нами на одной волне: от этого зависит **доверие** и та самая атмосфера, ради которой мы собираемся. Поэтому поток единый: **новички — обучение и тест на знание принципов**, с опытом бёрнов — **тот же тест** (без глав обучения).

Даже опыт не отменяет этого шага: на практике мы часто видим, что люди приходят с **разным пониманием базовых правил и ценностей**, а атмосферу бёрна легко испортить — недопонимание и «мелочи» накапливаются быстрее, чем кажется. Тест на знание принципов как раз про то, чтобы **говорить на одном языке** о том, что для нас не обсуждается. В конце — **электронный сертификат с уникальным кодом** (можно скачать PDF), когда тест успешно пройден.`
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
    <h1 class="font-display text-3xl sm:text-4xl text-burn-cream">Принципы бёрн-сообщества</h1>
    <FormattedBody :text="introText" />

    <div
      class="rounded-xl border border-burn-orange/40 bg-burn-orange/10 px-4 py-3 sm:flex sm:items-center sm:gap-4"
      role="note"
    >
      <div class="flex items-baseline gap-2 sm:shrink-0">
        <span class="font-display text-2xl text-burn-orange tabular-nums leading-none">~20</span>
        <span class="text-sm font-medium text-burn-cream/90">мин</span>
      </div>
      <p class="mt-2 text-sm leading-snug text-burn-cream/80 sm:mt-0">
        <span class="font-medium text-burn-cream/90">Среднее время прохождения</span>
        — теория и тест для новичков. Если идёшь сразу к аттестации, обычно хватает
        <span class="whitespace-nowrap text-burn-cream/90">~7 мин</span>.
      </p>
    </div>

    <p class="text-lg font-semibold text-burn-cream">Как тебе удобнее?</p>
    <div class="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        class="rounded-xl border-2 border-burn-orange bg-burn-card px-6 py-5 text-left transition hover:border-burn-orangeLight"
        @click="choose('newcomer')"
      >
        <span class="block font-semibold text-burn-cream">Я новичок в бёрн-культуре</span>
        <span class="mt-1 block text-base text-burn-cream/80">Главы с мини-проверкой после каждой, затем тест на знание принципов</span>
      </button>
      <button
        type="button"
        class="rounded-xl border-2 border-burn-border bg-burn-card px-6 py-5 text-left transition hover:border-burn-orange/50"
        @click="choose('experienced')"
      >
        <span class="block font-semibold text-burn-cream">У меня уже есть опыт бёрнов / кемпов</span>
        <span class="mt-1 block text-base text-burn-cream/80">Сразу тест на знание принципов и согласие</span>
      </button>
    </div>

    <p class="text-sm text-burn-cream/60">
      <RouterLink to="/" class="underline">Вернуться на главную</RouterLink>
    </p>
  </div>
</template>
