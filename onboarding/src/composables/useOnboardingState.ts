import { ref, computed } from 'vue'

const STORAGE_KEY = 'uralburn_onboarding'

/** Флаг в cookie для главной (site/index.html): есть выданный код сертификата. Код в cookie не кладём. */
export const CERTIFICATE_COOKIE_NAME = 'uralburn_certificate'
const CERT_COOKIE_MAX_AGE_SEC = 365 * 24 * 60 * 60

function syncCertificateCookie(s: OnboardingState) {
  const hasCert = Boolean(s.attestationPassed && s.certificateCode?.trim())
  try {
    if (hasCert) {
      document.cookie = `${CERTIFICATE_COOKIE_NAME}=1;path=/;max-age=${CERT_COOKIE_MAX_AGE_SEC};samesite=lax`
    } else {
      document.cookie = `${CERTIFICATE_COOKIE_NAME}=;path=/;max-age=0;samesite=lax`
    }
  } catch {
    // ignore
  }
}

export type OnboardingPath = 'newcomer' | 'experienced'

export interface OnboardingState {
  path: OnboardingPath | null
  /** Фактический путь, с которым выдан сертификат (фиксируется при submit_attestation). */
  certificatePath: OnboardingPath | null
  infoSeen: boolean
  quizPassed: boolean
  attestationPassed: boolean
  attestationPassedAt: string | null
  /** Код сертификата выдаётся только сервером после submit_attestation */
  certificateCode: string | null
  /** Имя на сертификате — только локально в браузере */
  certificateHolderName: string | null
}

function loadState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OnboardingState>
      const code = parsed.certificateCode?.trim() ?? null
      const attestationPassed = Boolean(parsed.attestationPassed) && Boolean(code)
      const result: OnboardingState = {
        path: parsed.path ?? null,
        certificatePath: parsed.certificatePath ?? null,
        infoSeen: parsed.infoSeen ?? false,
        quizPassed: parsed.quizPassed ?? false,
        attestationPassed,
        attestationPassedAt: attestationPassed ? parsed.attestationPassedAt ?? null : null,
        certificateCode: attestationPassed ? code : null,
        certificateHolderName: parsed.certificateHolderName ?? null,
      }
      const needsPersist =
        JSON.stringify({
          attestationPassed: parsed.attestationPassed,
          certificateCode: parsed.certificateCode ?? null,
          attestationPassedAt: parsed.attestationPassedAt ?? null,
        }) !==
        JSON.stringify({
          attestationPassed: result.attestationPassed,
          certificateCode: result.certificateCode,
          attestationPassedAt: result.attestationPassedAt,
        })
      if (needsPersist) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
        } catch {
          // ignore
        }
      }
      return result
    }
  } catch {
    // ignore
  }
  return {
    path: null,
    certificatePath: null,
    infoSeen: false,
    quizPassed: false,
    attestationPassed: false,
    attestationPassedAt: null,
    certificateCode: null,
    certificateHolderName: null,
  }
}

function saveState(s: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // ignore
  }
  syncCertificateCookie(s)
}

const state = ref<OnboardingState>(loadState())
syncCertificateCookie(state.value)

export function useOnboardingState() {
  const setPath = (path: OnboardingPath) => {
    state.value = { ...state.value, path }
    saveState(state.value)
  }

  const setInfoSeen = () => {
    state.value = { ...state.value, infoSeen: true }
    saveState(state.value)
  }

  const setQuizPassed = () => {
    state.value = { ...state.value, quizPassed: true }
    saveState(state.value)
  }

  /** Вызывать только после успешного ответа RPC submit_attestation */
  const setAttestationFromServer = (payload: {
    certificateCode: string
    attestationPassedAt: string
    certificatePath: OnboardingPath | null
  }) => {
    state.value = {
      ...state.value,
      attestationPassed: true,
      attestationPassedAt: payload.attestationPassedAt,
      certificateCode: payload.certificateCode.trim(),
      certificatePath: payload.certificatePath,
    }
    saveState(state.value)
  }

  const setCertificateHolderName = (name: string) => {
    const trimmed = name.trim()
    state.value = {
      ...state.value,
      certificateHolderName: trimmed || null,
    }
    saveState(state.value)
  }

  const canAccessCertificate = computed(
    () => state.value.attestationPassed && Boolean(state.value.certificateCode?.trim()),
  )

  const reset = () => {
    state.value = {
      path: null,
      certificatePath: null,
      infoSeen: false,
      quizPassed: false,
      attestationPassed: false,
      attestationPassedAt: null,
      certificateCode: null,
      certificateHolderName: null,
    }
    saveState(state.value)
  }

  return {
    state,
    setPath,
    setInfoSeen,
    setQuizPassed,
    setAttestationFromServer,
    setCertificateHolderName,
    canAccessCertificate,
    reset,
  }
}
