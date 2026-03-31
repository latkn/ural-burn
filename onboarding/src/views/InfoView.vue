<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingState } from '@/composables/useOnboardingState'
import { chapters } from '@/data/chapters'
import { shuffleIndices } from '@/utils/shuffleQuizOptions'
import FormattedBody from '@/components/FormattedBody.vue'
import ExpandedPrinciplesBlocks from '@/components/ExpandedPrinciplesBlocks.vue'
import PrinciplesBlocks from '@/components/PrinciplesBlocks.vue'

const router = useRouter()
const { setInfoSeen } = useOnboardingState()

const chapterIndex = ref(0)
const phase = ref<'read' | 'quiz'>('read')
const quizQuestionIndex = ref(0)
/** Ответы по текущей главе: индекс варианта или null, пока не выбран */
const quizAnswers = ref<(number | null)[]>([])
/** Для текущей главы: порядок индексов вариантов по каждому вопросу мини-квиза */
const chapterOptionOrders = ref<number[][]>([])
const wrongOnce = ref(false)

const chapter = computed(() => chapters[chapterIndex.value])
const isTenPrinciplesChapter = computed(() => chapter.value.id === 'ten-principles')
const totalChapters = chapters.length
const progress = computed(() => `${chapterIndex.value + 1} / ${totalChapters}`)

const currentQuizQuestion = computed(
  () => chapter.value.miniQuiz[quizQuestionIndex.value]
)
const isLastQuizQuestion = computed(
  () => quizQuestionIndex.value === chapter.value.miniQuiz.length - 1
)
const isLastChapter = computed(() => chapterIndex.value === totalChapters - 1)

const currentAnswer = computed({
  get() {
    return quizAnswers.value[quizQuestionIndex.value] ?? null
  },
  set(v: number) {
    wrongOnce.value = false
    const next = [...quizAnswers.value]
    next[quizQuestionIndex.value] = v
    quizAnswers.value = next
  },
})

function goToQuiz() {
  phase.value = 'quiz'
  quizQuestionIndex.value = 0
  wrongOnce.value = false
  quizAnswers.value = Array.from({ length: chapter.value.miniQuiz.length }, () => null)
  chapterOptionOrders.value = chapter.value.miniQuiz.map((q) => shuffleIndices(q.options.length))
}

function goNextQuiz() {
  if (quizAnswers.value[quizQuestionIndex.value] === null) return
  const q = currentQuizQuestion.value
  if (quizAnswers.value[quizQuestionIndex.value] !== q.correct) {
    wrongOnce.value = true
    return
  }
  wrongOnce.value = false
  if (isLastQuizQuestion.value) {
    if (isLastChapter.value) {
      setInfoSeen()
      router.push({ name: 'attestation' })
    } else {
      chapterIndex.value++
      phase.value = 'read'
      quizQuestionIndex.value = 0
      quizAnswers.value = []
    }
  } else {
    quizQuestionIndex.value++
  }
}

function goBackQuiz() {
  if (quizQuestionIndex.value <= 0) return
  wrongOnce.value = false
  quizQuestionIndex.value--
}

function nextChapter() {
  goToQuiz()
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch([chapterIndex, phase, quizQuestionIndex], async () => {
  await nextTick()
  scrollToTop()
})
</script>

<template>
  <div class="space-y-8">
    <p class="text-base text-burn-cream/65">Глава {{ progress }}</p>

    <template v-if="phase === 'read'">
      <h1 class="font-display text-3xl sm:text-4xl text-burn-cream">{{ chapter.title }}</h1>
      <FormattedBody :text="chapter.body" />
      <ExpandedPrinciplesBlocks v-if="isTenPrinciplesChapter" />
      <PrinciplesBlocks
        v-else-if="chapter.principleBlocks?.length"
        :blocks="chapter.principleBlocks"
      />
      <div v-if="chapter.bodyAfterPrinciples" class="mt-8">
        <FormattedBody :text="chapter.bodyAfterPrinciples" />
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
      <h2 class="font-display text-2xl sm:text-3xl text-burn-cream">Проверка: {{ chapter.title }}</h2>
      <p class="text-lg leading-relaxed text-burn-cream/85">
        Выбери правильный ответ, чтобы продолжить.
      </p>
      <div class="rounded-xl border border-burn-border bg-burn-card p-6 sm:p-8">
        <div class="mb-5 text-xl font-semibold leading-snug text-burn-cream">
          <FormattedBody :text="currentQuizQuestion.q" inline />
        </div>
        <p v-if="wrongOnce" class="mb-4 text-base text-amber-400">Попробуй ещё раз.</p>
        <ul class="space-y-3">
          <li
            v-for="origIdx in chapterOptionOrders[quizQuestionIndex]"
            :key="origIdx"
            class="flex items-start gap-3"
          >
            <input
              :id="`cq-${chapterIndex}-${quizQuestionIndex}-${origIdx}`"
              v-model="currentAnswer"
              type="radio"
              :value="origIdx"
              class="mt-1.5 h-4 w-4 shrink-0"
            />
            <label
              :for="`cq-${chapterIndex}-${quizQuestionIndex}-${origIdx}`"
              class="cursor-pointer text-lg leading-relaxed text-burn-cream/90"
            >
              <FormattedBody :text="currentQuizQuestion.options[origIdx]" inline />
            </label>
          </li>
        </ul>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button
            v-if="quizQuestionIndex > 0"
            type="button"
            class="rounded-lg border border-burn-border bg-transparent px-4 py-2 font-medium text-burn-cream hover:bg-burn-cream/5"
            @click="goBackQuiz"
          >
            Назад
          </button>
          <button
            type="button"
            class="rounded-lg bg-burn-orange px-4 py-2 font-medium text-burn-black hover:opacity-90 disabled:opacity-50"
            :disabled="currentAnswer === null"
            @click="goNextQuiz"
          >
            {{ isLastQuizQuestion ? (isLastChapter ? 'К аттестации' : 'К следующей главе') : 'Ответить' }}
          </button>
        </div>
      </div>
      <p class="text-base text-burn-cream/55">
        Вопрос {{ quizQuestionIndex + 1 }} из {{ chapter.miniQuiz.length }} в этой главе.
      </p>
    </template>
  </div>
</template>
