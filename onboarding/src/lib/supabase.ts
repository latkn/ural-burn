import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn('Supabase: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set')
}

export const supabase = url && anonKey ? createClient(url, anonKey) : null

/** Сообщения браузера про сбой fetch (офлайн, блокировка, CORS, DPI и т.д.) — без технического шума. */
function friendlyFetchFailureMessage(raw: string | undefined): string {
  if (!raw) return 'Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз.'
  const m = raw.toLowerCase()
  if (
    m.includes('network error') ||
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('networkerror') ||
    (m.includes('typeerror') && m.includes('fetch'))
  ) {
    return 'Не удалось связаться с сервером (сеть или блокировка). Попробуйте другой Wi‑Fi/VPN, отключите блокировщик на сайте или повторите позже.'
  }
  return raw
}

export type SubmitAttestationResult =
  | { ok: true; certificate_code: string; attestation_passed_at: string }
  | { ok: false; error: string; message?: string }

/**
 * Проверка ответов на сервере и выдача кода сертификата.
 * Если RPC недоступен, приложение выдаёт код локально (см. attestationFallback).
 */
export async function submitAttestation(params: {
  knowledgeAnswers: number[]
  agreementAll: boolean
  onboardingPath: 'newcomer' | 'experienced' | null
}): Promise<SubmitAttestationResult> {
  if (!supabase) {
    return {
      ok: false,
      error: 'no_client',
      message: 'Сервис недоступен. Проверьте подключение и настройки Supabase.',
    }
  }
  let data: unknown
  try {
    const out = await supabase.rpc('submit_attestation', {
      p_knowledge_answers: params.knowledgeAnswers,
      p_agreement_all: params.agreementAll,
      p_onboarding_path: params.onboardingPath,
    })
    data = out.data
    const error = out.error
    if (error) {
      return {
        ok: false,
        error: error.code || 'rpc_error',
        message: friendlyFetchFailureMessage(error.message) || 'Не удалось отправить аттестацию.',
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      ok: false,
      error: 'fetch_failed',
      message: friendlyFetchFailureMessage(msg),
    }
  }
  const row = data as {
    ok?: boolean
    certificate_code?: string
    attestation_passed_at?: string
    error?: string
    message?: string
  }
  if (!row?.ok) {
    return {
      ok: false,
      error: row.error || 'unknown',
      message: row.message,
    }
  }
  if (!row.certificate_code || !row.attestation_passed_at) {
    return { ok: false, error: 'invalid_response', message: 'Некорректный ответ сервера.' }
  }
  return {
    ok: true,
    certificate_code: row.certificate_code,
    attestation_passed_at:
      typeof row.attestation_passed_at === 'string'
        ? row.attestation_passed_at
        : String(row.attestation_passed_at),
  }
}

export type VerifyCertificateResult =
  | { ok: true; exists: boolean; created_at?: string }
  | { ok: false; error: string; message?: string }

/** Проверка кода в админке (только для admin_users). */
export async function verifyCertificateCode(code: string): Promise<VerifyCertificateResult> {
  if (!supabase) {
    return { ok: false, error: 'no_client', message: 'Supabase не настроен.' }
  }
  const { data, error } = await supabase.rpc('verify_certificate_code', { p_code: code.trim() })
  if (error) {
    return { ok: false, error: error.code || 'rpc_error', message: error.message }
  }
  const row = data as {
    ok?: boolean
    exists?: boolean
    created_at?: string
    error?: string
    message?: string
  }
  if (!row?.ok) {
    return {
      ok: false,
      error: row?.error || 'unknown',
      message: row?.message,
    }
  }
  return {
    ok: true,
    exists: Boolean(row.exists),
    created_at: row.created_at,
  }
}

export type CreateBurnProfileResult =
  | { ok: true; id: string; unique_code: string }
  | { ok: false; error: string; message: string }

export type BurnExperienceLevel = 'virgin' | 'experienced'
export type BurnHistoryItem = {
  year: string
  burn_name: string
  camp_name: string
}

export async function createBurnProfile(params: {
  full_name: string
  phone: string
  telegram: string
  email: string
  burn_experience_level: BurnExperienceLevel
  burn_history: BurnHistoryItem[]
}): Promise<CreateBurnProfileResult> {
  if (!supabase) {
    return { ok: false, error: 'no_client', message: 'Сервис регистрации недоступен.' }
  }
  const { data, error } = await supabase.rpc('create_burn_profile', {
    p_full_name: params.full_name.trim(),
    p_phone: params.phone.trim(),
    p_telegram: params.telegram.trim(),
    p_email: params.email.trim().toLowerCase(),
    p_burn_experience_level: params.burn_experience_level,
    p_burn_history: params.burn_history,
  })
  if (error) {
    return {
      ok: false,
      error: error.code || 'unknown',
      message: error.message || 'Не удалось создать профиль.',
    }
  }
  const result = data as { ok: boolean; id?: string; unique_code?: string; error?: string; message?: string }
  if (result.ok && result.unique_code) {
    return { ok: true, id: result.id!, unique_code: result.unique_code }
  }
  return {
    ok: false,
    error: result.error || 'unknown',
    message: (result as { message?: string }).message || 'Профиль с такими данными уже существует.',
  }
}
