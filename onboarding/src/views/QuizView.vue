<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingState } from '@/composables/useOnboardingState'
import { quizQuestions } from '@/data/quizQuestions'

const router = useRouter()
const { setQuizPassed } = useOnboardingState()

const current = ref(0)
const selected = ref<number | null>(null)
const wrongAnswer = ref(false)

const total = quizQuestions.length
const progress = computed(() => `${current.value + 1} / ${total}`)

function submit() {
  if (selected.value === null) return
  if (selected.value === quizQuestions[current.value].correct) {
    wrongAnswer.value = false
    if (current.value === total - 1) {
      setQuizPassed()
      router.push({ name: 'attestation' })
    } else {
      current.value++
      selected.value = null
    }
  } else {
    wrongAnswer.value = true
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="font-display text-2xl text-burn-cream">Мини-квиз</h1>
    <p class="text-burn-cream/80">Проверь, что усвоил базовое. Нужны все правильные ответы.</p>

    <div class="rounded-xl border border-burn-border bg-burn-card p-6">
      <p class="mb-4 font-medium text-burn-cream">{{ quizQuestions[current].q }}</p>
      <p v-if="wrongAnswer" class="mb-3 text-sm text-red-400">Неверно. Выбери другой вариант.</p>
      <ul class="space-y-2">
        <li
          v-for="(opt, i) in quizQuestions[current].options"
          :key="i"
          class="flex items-center gap-2"
        >
          <input
            :id="`opt-${current}-${i}`"
            v-model="selected"
            type="radio"
            :value="i"
            class="h-4 w-4"
          />
          <label :for="`opt-${current}-${i}`" class="cursor-pointer text-burn-cream/90">{{ opt }}</label>
        </li>
      </ul>
      <button
        type="button"
        class="mt-4 rounded-lg bg-burn-orange px-4 py-2 font-medium text-burn-black hover:opacity-90 disabled:opacity-50"
        :disabled="selected === null"
        @click="submit"
      >
        {{ current === total - 1 ? 'Завершить квиз' : 'Ответить' }}
      </button>
    </div>

    <p class="text-sm text-burn-cream/60">{{ progress }}</p>
  </div>
</template>
