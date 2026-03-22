<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, verifyCertificateCode } from '@/lib/supabase'

type BurnProfile = {
  id: string
  full_name: string
  phone: string
  telegram: string
  email: string
  unique_code: string
  burn_experience_level: 'virgin' | 'experienced'
  burn_profile_history: Array<{
    burn_year: number
    burn_name: string
    camp_name: string
  }>
  attestation_passed_at: string
  chat_link_sent_at: string | null
  created_at: string
}

const limit = 50

const loading = ref(false)
const error = ref<string | null>(null)
const profiles = ref<BurnProfile[]>([])
const search = ref('')

const certInput = ref('')
const certLoading = ref(false)
const certError = ref<string | null>(null)
const certResult = ref<{ exists: boolean; created_at?: string } | null>(null)

const hasSearch = computed(() => search.value.trim().length > 0)
const router = useRouter()

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return '-'
  }
}

function experienceTitle(profile: BurnProfile) {
  if (profile.burn_experience_level === 'virgin') {
    return 'Virgin burner (новичок): пока без burn-истории.'
  }
  if (!profile.burn_profile_history?.length) {
    return 'Experienced burner: история не заполнена.'
  }
  return profile.burn_profile_history
    .map((item) => `${item.burn_year}: ${item.burn_name}, кемп "${item.camp_name}"`)
    .join('\n')
}

async function fetchProfiles() {
  error.value = null
  profiles.value = []

  if (!supabase) {
    error.value = 'Supabase не настроен (env переменные отсутствуют).'
    return
  }

  loading.value = true

  let query = supabase
    .from('burn_profiles')
    .select(
      'id,full_name,phone,telegram,email,unique_code,burn_experience_level,attestation_passed_at,chat_link_sent_at,created_at,burn_profile_history(burn_year,burn_name,camp_name)',
    )
    .order('attestation_passed_at', { ascending: false })
    .limit(limit)

  if (hasSearch.value) {
    const q = search.value.trim()
    // OR по нескольким полям через PostgREST filter syntax.
    query = query.or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,telegram.ilike.%${q}%,email.ilike.%${q}%,unique_code.ilike.%${q}%`,
    )
  }

  const { data, error: selectError } = await query

  loading.value = false

  if (selectError) {
    error.value = selectError.message
    return
  }

  profiles.value = (data ?? []) as BurnProfile[]
}

async function logout() {
  if (!supabase) return
  await supabase.auth.signOut()
  await router.push({ name: 'admin-login' })
}

async function checkCertificateCode() {
  certError.value = null
  certResult.value = null
  const raw = certInput.value.trim()
  if (!raw) {
    certError.value = 'Введите код.'
    return
  }
  certLoading.value = true
  const res = await verifyCertificateCode(raw)
  certLoading.value = false
  if (!res.ok) {
    certError.value = res.message || res.error || 'Ошибка проверки'
    return
  }
  certResult.value = { exists: res.exists, created_at: res.created_at }
}

function formatCertDate(value: string | undefined) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString('ru-RU')
  } catch {
    return value
  }
}

onMounted(() => {
  fetchProfiles()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <section class="rounded-xl border border-burn-border bg-burn-card/40 p-4 space-y-3">
      <h2 class="text-lg font-semibold text-burn-cream">Проверка кода сертификата</h2>
      <p class="text-sm text-burn-muted">
        Формат кода: <span class="font-mono text-burn-cream/90">UB-ГГГГ-XXXXXX</span>
        (латиница без I и O, в суффиксе цифры 2–9). В базе хранится только код и дата фиксации — без имён.
      </p>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          v-model="certInput"
          type="text"
          autocomplete="off"
          placeholder="Например: UB-2026-A3K7P2"
          class="w-full px-3 py-2 rounded-lg bg-transparent border border-burn-border outline-none font-mono uppercase"
          @keyup.enter="checkCertificateCode"
        />
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-burn-orange text-burn-black font-semibold disabled:opacity-60 shrink-0"
          :disabled="certLoading"
          @click="checkCertificateCode"
        >
          {{ certLoading ? 'Проверка…' : 'Проверить' }}
        </button>
      </div>
      <p v-if="certError" class="text-sm text-red-300">{{ certError }}</p>
      <div v-else-if="certResult" class="text-sm rounded-lg border border-burn-border px-3 py-2">
        <template v-if="certResult.exists">
          <span class="text-emerald-400 font-medium">Код найден.</span>
          <span v-if="certResult.created_at" class="text-burn-muted">
            Зафиксирован: {{ formatCertDate(certResult.created_at) }}
          </span>
        </template>
        <template v-else>
          <span class="text-amber-300 font-medium">Код не найден</span>
          <span class="text-burn-muted"> — в базе нет такой записи (опечатка или сертификат не синхронизировался).</span>
        </template>
      </div>
    </section>

    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-burn-cream">Профили участников</h1>
        <p class="text-sm text-burn-muted">Показываем первые {{ limit }} записей (с возможностью поиска).</p>
      </div>
      <button
        class="px-3 py-2 rounded-lg border border-burn-border text-burn-ink bg-transparent hover:bg-white/5"
        @click="logout"
      >
        Выйти
      </button>
    </div>

    <div class="flex items-center gap-3">
      <input
        v-model="search"
        placeholder="Поиск: имя, телефон, telegram, email, unique_code"
        class="w-full px-3 py-2 rounded-lg bg-transparent border border-burn-border outline-none"
      />
      <button
        class="px-3 py-2 rounded-lg bg-burn-cream text-burn-ink font-semibold disabled:opacity-60"
        :disabled="loading"
        @click="fetchProfiles"
      >
        {{ loading ? 'Загрузка...' : 'Найти' }}
      </button>
    </div>

    <p v-if="error" class="text-sm text-red-300">
      {{ error }}
    </p>

    <div v-if="profiles.length === 0 && !loading" class="text-sm text-burn-muted">
      Нет данных.
    </div>

    <div v-else class="overflow-x-auto rounded-xl border border-burn-border">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left border-b border-burn-border">
            <th class="px-3 py-2">Имя</th>
            <th class="px-3 py-2">Телефон</th>
            <th class="px-3 py-2">Telegram</th>
            <th class="px-3 py-2">Email</th>
            <th class="px-3 py-2">Код</th>
            <th class="px-3 py-2">Ачивки</th>
            <th class="px-3 py-2">Аттестация</th>
            <th class="px-3 py-2">Создан</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in profiles"
            :key="p.id"
            class="border-b border-burn-border/60"
          >
            <td class="px-3 py-2">{{ p.full_name }}</td>
            <td class="px-3 py-2">{{ p.phone }}</td>
            <td class="px-3 py-2">{{ p.telegram }}</td>
            <td class="px-3 py-2">{{ p.email }}</td>
            <td class="px-3 py-2 font-mono">{{ p.unique_code }}</td>
            <td class="px-3 py-2">
              <div class="flex items-center gap-2">
                <span
                  v-if="p.burn_experience_level === 'virgin'"
                  :title="experienceTitle(p)"
                  class="inline-flex"
                >
                  🌱
                </span>
                <template v-else>
                  <span :title="experienceTitle(p)" class="inline-flex">🔥</span>
                  <span
                    v-for="(entry, idx) in p.burn_profile_history"
                    :key="`${p.id}-${idx}`"
                    :title="`${entry.burn_year}: ${entry.burn_name}, кемп '${entry.camp_name}'`"
                    class="inline-flex"
                  >
                    🏕️
                  </span>
                </template>
              </div>
            </td>
            <td class="px-3 py-2">{{ formatDate(p.attestation_passed_at) }}</td>
            <td class="px-3 py-2">{{ formatDate(p.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

