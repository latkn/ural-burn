<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingState } from '@/composables/useOnboardingState'
import { quizQuestions } from '@/data/quizQuestions'
import { shuffleIndices } from '@/utils/shuffleQuizOptions'
import FormattedBody from '@/components/FormattedBody.vue'

const router = useRouter()
const { setQuizPassed } = useOnboardingState()

const current = ref(0)
const selected = ref<number | null>(null)
const wrongAnswer = ref(false)

/** Порядок отображения вариантов (индексы в исходном массиве); ответ хранится как исходный индекс */
const optionOrder = ref(quizQuestions.map((q) => shuffleIndices(q.options.length)))

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
  <div class="space-y-8">
    <h1 class="font-display text-3xl sm:text-4xl text-burn-cream">Мини-квиз</h1>
    <p class="text-lg leading-relaxed text-burn-cream/85">
      Проверь, что усвоил базовое. <strong class="font-semibold text-burn-cream">Нужны все правильные ответы.</strong>
    </p>

    <div class="rounded-xl border border-burn-border bg-burn-card p-6 sm:p-8">
      <div class="mb-5 text-xl font-semibold leading-snug text-burn-cream">
        <FormattedBody :text="quizQuestions[current].q" inline />
      </div>
      <p v-if="wrongAnswer" class="mb-4 text-base text-red-400">Неверно. Выбери другой вариант.</p>
      <ul class="space-y-3">
        <li
          v-for="origIdx in optionOrder[current]"
          :key="origIdx"
          class="flex items-start gap-3"
        >
          <input
            :id="`opt-${current}-${origIdx}`"
            v-model="selected"
            type="radio"
            :value="origIdx"
            class="mt-1.5 h-4 w-4 shrink-0"
          />
          <label :for="`opt-${current}-${origIdx}`" class="cursor-pointer text-lg leading-relaxed text-burn-cream/90">
            <FormattedBody :text="quizQuestions[current].options[origIdx]" inline />
          </label>
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

    <p class="text-base text-burn-cream/55">{{ progress }}</p>
  </div>
</template>
