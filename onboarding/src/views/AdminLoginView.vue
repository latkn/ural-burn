<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

if (route.query.unauthorized === '1') {
  error.value = 'Нет доступа к админке.'
}

async function submit() {
  error.value = null

  if (!email.value.trim() || !password.value.trim()) {
    error.value = 'Введите email и пароль.'
    return
  }

  if (!supabase) {
    error.value = 'Supabase не настроен (env переменные отсутствуют).'
    return
  }

  loading.value = true
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  })
  loading.value = false

  if (signInError) {
    error.value = signInError.message
    return
  }

  await router.push({ name: 'admin-dashboard' })
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <div class="w-full max-w-md p-6 border border-burn-border rounded-xl bg-white/5 backdrop-blur">
      <h1 class="text-xl font-semibold text-burn-cream">Админка</h1>
      <p class="text-sm text-burn-muted mt-1">
        Войдите, чтобы просматривать профили участников.
      </p>

      <form class="mt-6 flex flex-col gap-3" @submit.prevent="submit">
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          class="px-3 py-2 rounded-lg bg-transparent border border-burn-border outline-none"
          autocomplete="username"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Пароль"
          class="px-3 py-2 rounded-lg bg-transparent border border-burn-border outline-none"
          autocomplete="current-password"
        />

        <button
          :disabled="loading"
          class="mt-1 px-3 py-2 rounded-lg bg-burn-cream text-burn-ink font-semibold disabled:opacity-60"
          type="submit"
        >
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>

      <p v-if="error" class="mt-4 text-sm text-red-300">
        {{ error }}
      </p>
    </div>
  </div>
</template>

