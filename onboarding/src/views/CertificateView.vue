<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useOnboardingState } from '@/composables/useOnboardingState'
const router = useRouter()
const { state, setCertificateHolderName } = useOnboardingState()

const certRef = ref<HTMLElement | null>(null)
const holderName = ref('')
const downloading = ref(false)
const pdfError = ref<string | null>(null)
const copyStatus = ref<'idle' | 'success' | 'error'>('idle')
let copyResetTimer: ReturnType<typeof setTimeout> | null = null

const code = computed(() => state.value.certificateCode ?? '')
const passedAt = computed(() => {
  const raw = state.value.attestationPassedAt
  if (!raw) return ''
  try {
    return new Date(raw).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return raw
  }
})

const displayName = computed(() => holderName.value.trim() || '________________')
const hasCompletedTraining = computed(() => state.value.certificatePath === 'newcomer')
const issuedLocally = computed(() => state.value.certificateIssuedLocally)

const canDownload = computed(() => holderName.value.trim().length >= 2)

/** Публичная ссылка-приглашение в Telegram; переопределяется через VITE_CHAT_LINK в Netlify / .env */
const communityChatUrl =
  import.meta.env.VITE_CHAT_LINK?.trim() || 'https://t.me/+0MWtWVzR6pdlMTIy'

onMounted(() => {
  if (!state.value.attestationPassed || !state.value.certificateCode?.trim()) {
    router.replace({ name: 'attestation' })
    return
  }
  holderName.value = state.value.certificateHolderName ?? ''
})

watch(holderName, (v) => {
  setCertificateHolderName(v)
})

async function onDownloadPdf() {
  pdfError.value = null
  if (!canDownload.value) {
    pdfError.value = 'Введите имя (не менее 2 символов), как оно должно быть в сертификате.'
    return
  }
  if (!certRef.value) return
  downloading.value = true
  try {
    const { downloadCertificatePdf } = await import('@/lib/certificatePdf')
    const safe =
      holderName.value.trim().replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s-]/g, '').slice(0, 80) || 'participant'
    const fname = `Ural-Burn-sertifikat-${code.value}-${safe.replace(/\s+/g, '_')}.pdf`
    await downloadCertificatePdf(certRef.value, fname)
  } catch (e) {
    pdfError.value = 'Не удалось сформировать PDF. Попробуйте другой браузер или отключите блокировку загрузок.'
    console.error(e)
  } finally {
    downloading.value = false
  }
}

async function onCopyCode() {
  if (!code.value.trim()) return
  try {
    await navigator.clipboard.writeText(code.value)
    copyStatus.value = 'success'
  } catch {
    copyStatus.value = 'error'
  }

  if (copyResetTimer) {
    clearTimeout(copyResetTimer)
  }
  copyResetTimer = setTimeout(() => {
    copyStatus.value = 'idle'
    copyResetTimer = null
  }, 1800)
}

onUnmounted(() => {
  if (copyResetTimer) {
    clearTimeout(copyResetTimer)
  }
})
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="font-display text-3xl text-burn-cream">Сертификат бёрнера</h1>
      <p class="mt-3 text-burn-cream/85 leading-relaxed">
        Ты прошёл(а) аттестацию. Укажи имя для сертификата — оно сохранится только в этом браузере.
        Ниже твой уникальный код: его можно сообщить организаторам или приложить к сообщению вместе с PDF.
      </p>
    </div>

    <div class="rounded-xl border border-burn-border bg-burn-card p-5 space-y-3">
      <label for="cert-name" class="block text-sm font-medium text-burn-cream/90">Имя на сертификате</label>
      <input
        id="cert-name"
        v-model="holderName"
        type="text"
        autocomplete="name"
        maxlength="120"
        placeholder="Как к тебе обращаться"
        class="w-full rounded-lg border border-burn-border bg-burn-dark px-4 py-3 text-burn-cream placeholder:text-burn-muted focus:border-burn-orange focus:outline-none focus:ring-1 focus:ring-burn-orange"
      />
      <p class="text-xs text-burn-muted">
        Регистрация профиля на сайте сейчас отключена — мы не собираем эти данные на сервере.
      </p>
    </div>

    <div class="rounded-xl border border-burn-orange/40 bg-burn-dark/60 p-4">
      <p class="text-sm text-burn-cream/70">Уникальный код для проверки</p>
      <div class="mt-1 flex flex-wrap items-center gap-2">
        <p class="font-mono text-xl font-semibold tracking-wide text-burn-orange break-all">{{ code }}</p>
        <div class="inline-flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-burn-orange/60 bg-burn-orange/10 text-burn-orange transition hover:bg-burn-orange/20 hover:border-burn-orange"
            title="Скопировать код"
            aria-label="Скопировать код"
            @click="onCopyCode"
          >
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <p class="text-xs text-burn-muted min-w-24">
            {{ copyStatus === 'success' ? 'Скопировано' : copyStatus === 'error' ? 'Ошибка' : '' }}
          </p>
        </div>
      </div>
      <p v-if="issuedLocally" class="mt-3 text-xs text-burn-muted leading-relaxed">
        Код сгенерирован на этой странице (сервер сейчас недоступен). Сохрани PDF и передай код организаторам — дубликаты сверяем по списку вручную.
      </p>
      <p v-else class="mt-3 text-xs text-burn-muted leading-relaxed">
        Код выдан сервером после успешной аттестации и записан в базу (без имени) — организаторы могут проверить его в админке.
      </p>
    </div>

    <div
      class="rounded-xl border border-burn-border bg-burn-card/90 p-5 shadow-[0_0_24px_rgba(0,0,0,0.25)]"
    >
      <h2 class="font-display text-lg text-burn-cream">Группа «Уральский бёрн» в Telegram</h2>
      <p class="mt-2 text-sm leading-relaxed text-burn-cream/85">
        Вступи в группу сообщества, чтобы быть в курсе всех новостей, анонсов и жизни бёрна.
      </p>
      <a
        :href="communityChatUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-4 inline-flex items-center justify-center rounded-xl border border-burn-orange/60 bg-burn-orange/10 px-5 py-3 text-sm font-semibold text-burn-orange transition hover:bg-burn-orange/20 hover:border-burn-orange"
      >
        Вступить в группу
      </a>
    </div>

    <p v-if="pdfError" class="text-sm text-amber-400">{{ pdfError }}</p>

    <div class="overflow-x-auto -mx-4 px-4 pb-2">
      <!-- Лист A4 595×842 (72 dpi) — для PDF и превью -->
      <div
        ref="certRef"
        class="certificate-sheet relative mx-auto flex w-[595px] min-w-[595px] flex-col justify-between border-[3px] border-burn-orange bg-[#0c0c0c] p-10 text-center shadow-[0_0_40px_rgba(234,88,12,0.15)]"
        style="height: 842px; box-sizing: border-box"
      >
        <div
          class="pointer-events-none absolute inset-3 border border-burn-orangeDim/50"
          aria-hidden="true"
        />
        <div
          class="pointer-events-none absolute inset-6 border border-dashed border-burn-orange/30"
          aria-hidden="true"
        />

        <header class="relative z-10">
          <p class="font-display text-sm uppercase tracking-[0.35em] text-burn-orange/90">Уральский бёрн</p>
          <h2 class="font-display mt-4 text-3xl text-burn-cream">Сертификат</h2>
          <p class="mt-2 text-sm text-burn-muted">об успешном прохождении онбординга и аттестации</p>
        </header>

        <div class="relative z-10 flex flex-1 flex-col justify-center px-2 py-6">
          <p class="text-sm text-burn-cream/75">Настоящим подтверждается, что</p>
          <p class="font-display mt-5 text-3xl leading-tight text-burn-cream break-words">
            {{ displayName }}
          </p>
          <div class="mx-auto mt-8 h-px w-48 bg-gradient-to-r from-transparent via-burn-orange/80 to-transparent" />
          <p class="mt-6 text-sm leading-relaxed text-burn-cream/80">
            {{
              hasCompletedTraining
                ? 'прошёл(ла) обучение и подтвердил(а) знание основ бёрн-культуры и правил сообщества.'
                : 'подтвердил(а) знание основ бёрн-культуры и правил сообщества.'
            }}
          </p>
        </div>

        <footer class="relative z-10 space-y-4">
          <div class="rounded-lg border border-burn-border bg-burn-card/80 px-4 py-3">
            <p class="text-xs uppercase tracking-wider text-burn-muted">Код проверки</p>
            <p class="mt-1 font-mono text-lg text-burn-orange">{{ code }}</p>
          </div>
          <p v-if="passedAt" class="text-xs text-burn-muted">Дата: {{ passedAt }}</p>
          <p class="text-[11px] leading-relaxed text-burn-muted/90">
            Документ сформирован автоматически после прохождения теста на знание принципов бёрн-сообщества.
            Сообщите организаторам этот код — так мы сможем подтвердить прохождение.
          </p>
          <p class="text-2xl" aria-hidden="true">🔥</p>
        </footer>
      </div>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-xl bg-burn-orange px-6 py-3 font-semibold text-burn-black transition hover:bg-burn-orangeLight disabled:opacity-50"
        :disabled="!canDownload || downloading"
        @click="onDownloadPdf"
      >
        {{ downloading ? 'Готовим PDF…' : 'Скачать PDF' }}
      </button>
      <RouterLink
        to="/"
        class="text-center text-sm text-burn-muted underline hover:text-burn-cream"
      >
        На главную
      </RouterLink>
    </div>

    <p class="text-center text-sm text-burn-muted">
      Новости сообщества —
      <a
        :href="communityChatUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="text-burn-orange underline hover:text-burn-orangeLight"
      >
        группа в Telegram
      </a>
    </p>
  </div>
</template>
