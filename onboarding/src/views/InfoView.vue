<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingState } from '@/composables/useOnboardingState'
import { chapters } from '@/data/chapters'

const router = useRouter()
const { setInfoSeen } = useOnboardingState()

const chapterIndex = ref(0)
const phase = ref<'read' | 'quiz'>('read')
const quizQuestionIndex = ref(0)
const selected = ref<number | null>(null)
const wrongOnce = ref(false)

const chapter = computed(() => chapters[chapterIndex.value])
const totalChapters = chapters.length
const progress = computed(() => `${chapterIndex.value + 1} / ${totalChapters}`)

const currentQuizQuestion = computed(
  () => chapter.value.miniQuiz[quizQuestionIndex.value]
)
const isLastQuizQuestion = computed(
  () => quizQuestionIndex.value === chapter.value.miniQuiz.length - 1
)
const isLastChapter = computed(() => chapterIndex.value === totalChapters - 1)

function goToQuiz() {
  phase.value = 'quiz'
  quizQuestionIndex.value = 0
  selected.value = null
  wrongOnce.value = false
}

function submitQuizAnswer() {
  if (selected.value === null) return
  if (selected.value === currentQuizQuestion.value.correct) {
    wrongOnce.value = false
    if (isLastQuizQuestion.value) {
      if (isLastChapter.value) {
        setInfoSeen()
        router.push({ name: 'attestation' })
      } else {
        chapterIndex.value++
        phase.value = 'read'
        quizQuestionIndex.value = 0
        selected.value = null
      }
    } else {
      quizQuestionIndex.value++
      selected.value = null
    }
  } else {
    wrongOnce.value = true
  }
}

function nextChapter() {
  goToQuiz()
}
</script>

<template>
  <div class="space-y-6">
    <p class="text-sm text-burn-cream/60">Глава {{ progress }}</p>

    <template v-if="phase === 'read'">
      <h1 class="font-display text-2xl text-burn-cream">{{ chapter.title }}</h1>
      <div class="text-burn-cream/90 leading-relaxed whitespace-pre-line">
        {{ chapter.body }}
      </div>
      <div class="pt-4">
        <button
          type="button"
          class="rounded-lg bg-burn-orange px-4 py-2 font-medium text-burn-black hover:opacity-90"
          @click="nextChapter"
        >
          Проверим, что усвоил →
        </button>
      </div>
    </template>

    <template v-else>
      <h2 class="font-display text-xl text-burn-cream">Проверка: {{ chapter.title }}</h2>
      <p class="text-burn-cream/80 text-sm">Выбери правильный ответ, чтобы продолжить.</p>
      <div class="rounded-xl border border-burn-border bg-burn-card p-6">
        <p class="mb-4 font-medium text-burn-cream">{{ currentQuizQuestion.q }}</p>
        <p v-if="wrongOnce" class="mb-3 text-sm text-amber-400">Попробуй ещё раз.</p>
        <ul class="space-y-2">
          <li
            v-for="(opt, i) in currentQuizQuestion.options"
            :key="i"
            class="flex items-center gap-2"
          >
            <input
              :id="`cq-${chapterIndex}-${quizQuestionIndex}-${i}`"
              v-model="selected"
              type="radio"
              :value="i"
              class="h-4 w-4"
            />
            <label
              :for="`cq-${chapterIndex}-${quizQuestionIndex}-${i}`"
              class="cursor-pointer text-burn-cream/90"
            >
              {{ opt }}
            </label>
          </li>
        </ul>
        <button
          type="button"
          class="mt-4 rounded-lg bg-burn-orange px-4 py-2 font-medium text-burn-black hover:opacity-90 disabled:opacity-50"
          :disabled="selected === null"
          @click="submitQuizAnswer"
        >
          {{ isLastQuizQuestion ? (isLastChapter ? 'К аттестации' : 'К следующей главе') : 'Ответить' }}
        </button>
      </div>
      <p class="text-sm text-burn-cream/50">
        Вопрос {{ quizQuestionIndex + 1 }} из {{ chapter.miniQuiz.length }} в этой главе.
      </p>
    </template>
  </div>
</template>
