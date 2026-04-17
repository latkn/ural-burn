/** Как на сервере: UB-ГГГГ-XXXXXX, без похожих символов 0/O, 1/I */
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomSuffix(length: number): string {
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CHARSET[bytes[i]! % CHARSET.length]
  }
  return out
}

/** Локальная выдача, если Supabase недоступен — формат совпадает с RPC. */
export function generateLocalCertificateCode(): string {
  const year = new Date().getFullYear()
  return `UB-${year}-${randomSuffix(6)}`
}
