<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingState } from '@/composables/useOnboardingState'
import { submitAttestation } from '@/lib/supabase'
import {
  knowledgeQuestions,
  attestationKnowledgeThreshold,
  agreementItems,
} from '@/data/attestationQuestions'
import FormattedBody from '@/components/FormattedBody.vue'

const router = useRouter()
const { setAttestationFromServer } = useOnboardingState()

const submitLoading = ref(false)
const submitError = ref<string | null>(null)

const phase = ref<'knowledge' | 'agreement'>('knowledge')
const totalKnowledge = knowledgeQuestions.length
const answers = ref<(number | null)[]>(Array.from({ length: totalKnowledge }, () => null))
const kIndex = ref(0)
const knowledgeFailure = ref(false)

const agreementChecked = ref(agreementItems.map(() => false))

const progress = computed(() => `Вопрос ${kIndex.value + 1} из ${totalKnowledge}`)

const currentAnswer = computed({
  get() {
    return answers.value[kIndex.value]
  },
  set(v: number) {
    const next = [...answers.value]
    next[kIndex.value] = v
    answers.value = next
  },
})

function countCorrect() {
  return answers.value.filter(
    (a, i) => a !== null && a === knowledgeQuestions[i].correct
  ).length
}

const knowledgePassed = computed(() => {
  if (!answers.value.every((a) => a !== null)) return false
  return countCorrect() >= Math.ceil(totalKnowledge * attestationKnowledgeThreshold)
})

function finishKnowledgeBlock() {
  if (answers.value[kIndex.value] === null) return
  if (knowledgePassed.value) {
    phase.value = 'agreement'
  } else {
    knowledgeFailure.value = true
  }
}

function goNext() {
  if (answers.value[kIndex.value] === null) return
  if (kIndex.value < totalKnowledge - 1) {
    kIndex.value++
  } else {
    finishKnowledgeBlock()
  }
}

function goBack() {
  if (kIndex.value <= 0) return
  kIndex.value--
}

async function submitAgreement() {
  if (!agreementChecked.value.every(Boolean)) return
  submitError.value = null
  if (!answers.value.every((a) => a !== null)) {
    submitError.value = 'Ответы на тест неполные. Пройдите блок с вопросами заново.'
    return
  }
  submitLoading.value = true
  const res = await submitAttestation({
    knowledgeAnswers: answers.value as number[],
    agreementAll: true,
  })
  submitLoading.value = false
  if (!res.ok) {
    submitError.value = res.message || 'Не удалось завершить аттестацию. Попробуйте позже.'
    return
  }
  setAttestationFromServer({
    certificateCode: res.certificate_code,
    attestationPassedAt: res.attestation_passed_at,
  })
  await router.push({ name: 'certificate' })
}

function retryKnowledge() {
  kIndex.value = 0
  answers.value = Array.from({ length: totalKnowledge }, () => null)
  knowledgeFailure.value = false
}
</script>

<template>
  <div class="space-y-8">
    <h1 class="font-display text-3xl sm:text-4xl text-burn-cream">Тест на знание принципов Burning Man</h1>

    <template v-if="phase === 'knowledge'">
      <p class="text-lg leading-relaxed text-burn-cream/85">
        <strong class="font-semibold text-burn-cream">Тест знаний.</strong>
        Один правильный ответ на каждый вопрос. Для прохождения нужно
        <strong class="font-semibold text-burn-cream">100% правильных ответов</strong> — иначе сертификат не выдаётся.
        Можно вернуться к предыдущим вопросам и изменить ответ; дальше без ответа на текущий вопрос не пройти.
      </p>

      <div v-if="knowledgeFailure" class="rounded-xl border border-red-500/50 bg-red-500/10 p-6 sm:p-8">
        <p class="text-lg font-semibold text-red-300">Тест не пройден. Нужны все правильные ответы.</p>
        <p class="mt-3 text-base leading-relaxed text-burn-cream/85">Почитай материалы и попробуй снова.</p>
        <button
          type="button"
          class="mt-4 rounded-lg bg-burn-orange px-4 py-2 font-medium text-burn-black"
          @click="retryKnowledge"
        >
          Пройти заново
        </button>
      </div>

      <div v-else class="rounded-xl border border-burn-border bg-burn-card p-6 sm:p-8">
        <div class="mb-5 text-xl font-semibold leading-snug text-burn-cream">
          <FormattedBody :text="knowledgeQuestions[kIndex].q" inline />
        </div>
        <ul class="space-y-3">
          <li
            v-for="(opt, i) in knowledgeQuestions[kIndex].options"
            :key="i"
            class="flex items-start gap-3"
          >
            <input
              :id="`k-${kIndex}-${i}`"
              v-model="currentAnswer"
              type="radio"
              :value="i"
              class="mt-1.5 h-4 w-4 shrink-0"
            />
            <label :for="`k-${kIndex}-${i}`" class="cursor-pointer text-lg leading-relaxed text-burn-cream/90">
              <FormattedBody :text="opt" inline />
            </label>
          </li>
        </ul>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button
            v-if="kIndex > 0"
            type="button"
            class="rounded-lg border border-burn-border bg-transparent px-4 py-2 font-medium text-burn-cream hover:bg-burn-cream/5"
            @click="goBack"
          >
            Назад
          </button>
          <button
            type="button"
            class="rounded-lg bg-burn-orange px-4 py-2 font-medium text-burn-black hover:opacity-90 disabled:opacity-50"
            :disabled="currentAnswer === null"
            @click="goNext"
          >
            {{ kIndex < totalKnowledge - 1 ? 'Далее' : 'Завершить тест' }}
          </button>
        </div>
      </div>
      <p class="text-base text-burn-cream/55">{{ progress }}</p>
    </template>

    <template v-else>
      <p class="text-lg leading-relaxed text-burn-cream/85">
        Подтверди согласие <strong class="font-semibold text-burn-cream">со всеми пунктами</strong>.
      </p>
      <p v-if="submitError" class="text-base text-red-300">{{ submitError }}</p>
      <div class="rounded-xl border border-burn-border bg-burn-card p-6 sm:p-8">
        <ul class="space-y-4">
          <li v-for="(item, i) in agreementItems" :key="i" class="flex items-start gap-3">
            <input
              :id="`a-${i}`"
              v-model="agreementChecked[i]"
              type="checkbox"
              class="mt-1.5 h-4 w-4 shrink-0"
            />
            <label :for="`a-${i}`" class="cursor-pointer text-lg leading-relaxed text-burn-cream/90">
              <FormattedBody :text="item" inline />
            </label>
          </li>
        </ul>
        <button
          type="button"
          class="mt-4 rounded-lg bg-burn-orange px-4 py-2 font-medium text-burn-black hover:opacity-90 disabled:opacity-50"
          :disabled="!agreementChecked.every(Boolean) || submitLoading"
          @click="submitAgreement"
        >
          {{ submitLoading ? 'Отправка…' : 'Готово — получить сертификат' }}
        </button>
      </div>
    </template>
  </div>
</template>
