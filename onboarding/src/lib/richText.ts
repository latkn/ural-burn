export interface TextSegment {
  text: string
  bold?: boolean
}

/** Разбивает текст на абзацы по пустым строкам. */
export function splitParagraphs(body: string): string[] {
  const t = body.trim()
  if (!t) return []
  return t
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/**
 * Парсит фрагменты **жирный** в сегменты. Непарные ** остаются обычным текстом.
 */
export function parseBoldSegments(paragraph: string): TextSegment[] {
  const parts: TextSegment[] = []
  const re = /\*\*(.+?)\*\*/gs
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(paragraph)) !== null) {
    if (m.index > last) {
      parts.push({ text: paragraph.slice(last, m.index) })
    }
    parts.push({ text: m[1], bold: true })
    last = m.index + m[0].length
  }
  if (last < paragraph.length) {
    parts.push({ text: paragraph.slice(last) })
  }
  if (parts.length === 0) {
    parts.push({ text: paragraph })
  }
  return parts
}
