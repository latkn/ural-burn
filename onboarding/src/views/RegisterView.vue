<!--
  Регистрация Burn-профиля отключена (маршрут /register ведёт на сертификат).
  Файл сохранён для возможного восстановления позже.
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createBurnProfile, type BurnExperienceLevel } from '@/lib/supabase'

const router = useRouter()
const loading = ref(false)
const error = ref('')

const form = ref({
  full_name: '',
  phone: '',
  telegram: '',
  email: '',
  burn_experience_level: 'virgin' as BurnExperienceLevel,
})

const burnHistory = ref([
  { year: '', burn_name: '', camp_name: '' },
])

function addBurnHistoryRow() {
  burnHistory.value.push({ year: '', burn_name: '', camp_name: '' })
}

function removeBurnHistoryRow(index: number) {
  if (burnHistory.value.length === 1) return
  burnHistory.value.splice(index, 1)
}

function hasInvalidBurnHistory() {
  if (form.value.burn_experience_level !== 'experienced') return false
  return burnHistory.value.some((item) => !item.year.trim() || !item.burn_name.trim() || !item.camp_name.trim())
}

async function submit() {
  error.value = ''
  if (!form.value.full_name.trim() || !form.value.phone.trim() || !form.value.telegram.trim() || !form.value.email.trim()) {
    error.value = 'Заполните все поля.'
    return
  }
  if (hasInvalidBurnHistory()) {
    error.value = 'Для опытного бёрнера заполните год, название бёрна и кемп.'
    return
  }

  loading.value = true
  const result = await createBurnProfile({
    full_name: form.value.full_name,
    phone: form.value.phone,
    telegram: form.value.telegram,
    email: form.value.email,
    burn_experience_level: form.value.burn_experience_level,
    burn_history:
      form.value.burn_experience_level === 'experienced'
        ? burnHistory.value.map((item) => ({
            year: item.year.trim(),
            burn_name: item.burn_name.trim(),
            camp_name: item.camp_name.trim(),
          }))
        : [],
  })
  loading.value = false
  if (result.ok) {
    router.push({ name: 'success', query: { code: result.unique_code } })
  } else {
    error.value = result.message
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="font-display text-2xl text-burn-cream">Создать Burn-профиль</h1>
    <p class="text-burn-cream/80">
      Ты прошёл аттестацию. Осталось указать данные — мы выдадим уникальный код и ссылку на чат участников.
    </p>

    <form class="space-y-4" @submit.prevent="submit">
      <div class="rounded-lg border border-burn-border p-4 space-y-3">
        <p class="text-sm text-burn-cream/80">Burn-опыт *</p>
        <label class="flex items-center gap-2">
          <input v-model="form.burn_experience_level" type="radio" value="virgin" />
          <span>Я virgin burner (новичок)</span>
        </label>
        <label class="flex items-center gap-2">
          <input v-model="form.burn_experience_level" type="radio" value="experienced" />
          <span>Я experienced burner (опытный)</span>
        </label>
      </div>

      <div>
        <label for="full_name" class="mb-1 block text-sm text-burn-cream/80">Полное ФИО *</label>
        <input
          id="full_name"
          v-model="form.full_name"
          type="text"
          required
          class="w-full rounded-lg border border-burn-border bg-burn-card px-3 py-2 text-burn-cream placeholder:text-burn-cream/50"
          placeholder="Иванов Иван Иванович"
        />
      </div>
      <div>
        <label for="phone" class="mb-1 block text-sm text-burn-cream/80">Телефон *</label>
        <input
          id="phone"
          v-model="form.phone"
          type="tel"
          required
          class="w-full rounded-lg border border-burn-border bg-burn-card px-3 py-2 text-burn-cream placeholder:text-burn-cream/50"
          placeholder="+7 900 123-45-67"
        />
      </div>
      <div>
        <label for="telegram" class="mb-1 block text-sm text-burn-cream/80">Telegram *</label>
        <input
          id="telegram"
          v-model="form.telegram"
          type="text"
          required
          class="w-full rounded-lg border border-burn-border bg-burn-card px-3 py-2 text-burn-cream placeholder:text-burn-cream/50"
          placeholder="@username или ссылка"
        />
      </div>
      <div>
        <label for="email" class="mb-1 block text-sm text-burn-cream/80">Email *</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          class="w-full rounded-lg border border-burn-border bg-burn-card px-3 py-2 text-burn-cream placeholder:text-burn-cream/50"
          placeholder="you@example.com"
        />
      </div>
      <div
        v-if="form.burn_experience_level === 'experienced'"
        class="rounded-lg border border-burn-border p-4 space-y-3"
      >
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-burn-cream/80">Burn History (опыт участия)</p>
          <button
            type="button"
            class="rounded-lg border border-burn-border px-3 py-1 text-sm hover:bg-white/5"
            @click="addBurnHistoryRow"
          >
            + Добавить burn
          </button>
        </div>

        <div
          v-for="(item, idx) in burnHistory"
          :key="idx"
          class="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-lg border border-burn-border/70 p-3"
        >
          <input
            v-model="item.year"
            type="number"
            min="1986"
            max="2100"
            placeholder="Год"
            class="rounded-lg border border-burn-border bg-burn-card px-3 py-2 text-burn-cream placeholder:text-burn-cream/50"
          />
          <input
            v-model="item.burn_name"
            type="text"
            placeholder="Название бёрна"
            class="rounded-lg border border-burn-border bg-burn-card px-3 py-2 text-burn-cream placeholder:text-burn-cream/50"
          />
          <input
            v-model="item.camp_name"
            type="text"
            placeholder="Кемп"
            class="rounded-lg border border-burn-border bg-burn-card px-3 py-2 text-burn-cream placeholder:text-burn-cream/50"
          />
          <button
            type="button"
            class="rounded-lg border border-burn-border px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
            :disabled="burnHistory.length === 1"
            @click="removeBurnHistoryRow(idx)"
          >
            Удалить
          </button>
        </div>
      </div>
      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
      <button
        type="submit"
        class="rounded-lg bg-burn-orange px-4 py-2 font-medium text-burn-black hover:opacity-90 disabled:opacity-50"
        :disabled="loading"
      >
        {{ loading ? 'Отправка…' : 'Зарегистрироваться' }}
      </button>
    </form>
  </div>
</template>
