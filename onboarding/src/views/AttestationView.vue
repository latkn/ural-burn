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

const router = useRouter()
const { setAttestationFromServer } = useOnboardingState()

const submitLoading = ref(false)
const submitError = ref<string | null>(null)

const phase = ref<'knowledge' | 'agreement'>('knowledge')
const kIndex = ref(0)
const kAnswers = ref<number[]>([])
const kSelected = ref<number | null>(null)
const agreementChecked = ref(agreementItems.map(() => false))

const totalKnowledge = knowledgeQuestions.length
const progress = computed(() => `Вопрос ${kIndex.value + 1} из ${totalKnowledge}`)

const knowledgePassed = computed(() => {
  const correct = kAnswers.value.filter((a, i) => a === knowledgeQuestions[i].correct).length
  return correct >= Math.ceil(totalKnowledge * attestationKnowledgeThreshold)
})

function submitKnowledge() {
  if (kSelected.value === null) return
  const nextAnswers = [...kAnswers.value, kSelected.value]
  kAnswers.value = nextAnswers
  kSelected.value = null
  if (kIndex.value < totalKnowledge - 1) {
    kIndex.value++
  } else {
    const correct = nextAnswers.filter((a, i) => a === knowledgeQuestions[i].correct).length
    if (correct >= Math.ceil(totalKnowledge * attestationKnowledgeThreshold)) {
      phase.value = 'agreement'
    }
  }
}

const knowledgeFailed = computed(
  () =>
    phase.value === 'knowledge' &&
    kAnswers.value.length === totalKnowledge &&
    !knowledgePassed.value
)

async function submitAgreement() {
  if (!agreementChecked.value.every(Boolean)) return
  submitError.value = null
  if (kAnswers.value.length !== totalKnowledge) {
    submitError.value = 'Ответы на тест неполные. Пройдите блок с вопросами заново.'
    return
  }
  submitLoading.value = true
  const res = await submitAttestation({
    knowledgeAnswers: kAnswers.value,
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
  kAnswers.value = []
  kSelected.value = null
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="font-display text-2xl text-burn-cream">Аттестация</h1>

    <template v-if="phase === 'knowledge'">
      <p class="text-burn-cream/80">Тест знаний. Один правильный ответ на каждый вопрос. Для прохождения нужно не менее 80% правильных.</p>

      <div v-if="knowledgeFailed" class="rounded-xl border border-red-500/50 bg-red-500/10 p-6">
        <p class="font-medium text-red-300">Тест не пройден. Нужно не менее 80% правильных ответов.</p>
        <p class="mt-2 text-sm text-burn-cream/80">Почитай материалы и попробуй снова.</p>
        <button
          type="button"
          class="mt-4 rounded-lg bg-burn-orange px-4 py-2 font-medium text-burn-black"
          @click="retryKnowledge"
        >
          Пройти заново
        </button>
      </div>

      <div v-else class="rounded-xl border border-burn-border bg-burn-card p-6">
        <p class="mb-4 font-medium text-burn-cream">{{ knowledgeQuestions[kIndex].q }}</p>
        <ul class="space-y-2">
          <li
            v-for="(opt, i) in knowledgeQuestions[kIndex].options"
            :key="i"
            class="flex items-center gap-2"
          >
            <input
              :id="`k-${kIndex}-${i}`"
              v-model="kSelected"
              type="radio"
              :value="i"
              class="h-4 w-4"
            />
            <label :for="`k-${kIndex}-${i}`" class="cursor-pointer text-burn-cream/90">{{ opt }}</label>
          </li>
        </ul>
        <div class="mt-4 flex items-center gap-3">
          <button
            type="button"
            class="rounded-lg bg-burn-orange px-4 py-2 font-medium text-burn-black hover:opacity-90 disabled:opacity-50"
            :disabled="kSelected === null"
            @click="submitKnowledge"
          >
            {{ kIndex < totalKnowledge - 1 ? 'Далее' : 'Завершить тест' }}
          </button>
        </div>
      </div>
      <p class="text-sm text-burn-cream/60">{{ progress }}</p>
    </template>

    <template v-else>
      <p class="text-burn-cream/80">Подтверди согласие со всеми пунктами.</p>
      <p v-if="submitError" class="text-sm text-red-300">{{ submitError }}</p>
      <div class="rounded-xl border border-burn-border bg-burn-card p-6">
        <ul class="space-y-3">
          <li v-for="(item, i) in agreementItems" :key="i" class="flex items-center gap-2">
            <input
              :id="`a-${i}`"
              v-model="agreementChecked[i]"
              type="checkbox"
              class="h-4 w-4"
            />
            <label :for="`a-${i}`" class="cursor-pointer text-burn-cream/90">{{ item }}</label>
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
