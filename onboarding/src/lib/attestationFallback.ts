import type { SubmitAttestationResult } from '@/lib/supabase'

/** RPC ответил по смыслу — локальный сертификат не выдаём. */
const SERVER_BUSINESS_REJECTIONS = new Set([
  'knowledge_failed',
  'agreement_required',
  'invalid_answers_length',
  'invalid_answer_index',
])

export function shouldUseLocalAttestationFallback(
  res: Extract<SubmitAttestationResult, { ok: false }>,
): boolean {
  return !SERVER_BUSINESS_REJECTIONS.has(res.error)
}
