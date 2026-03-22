/**
 * Сжимает растровые изображения в public/images (JPEG, PNG, WebP).
 * Перезаписывает файл только если результат меньше исходника.
 * SVG не трогает (для них лучше отдельно svgo).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', 'public', 'images')

/** Длинная сторона не больше этого (px). 0 = не уменьшать габариты. ENV: OPTIMIZE_IMAGES_MAX_EDGE */
const MAX_EDGE_PX = Number(process.env.OPTIMIZE_IMAGES_MAX_EDGE ?? 2560)

const RASTER_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])

async function collectFiles(dir, out = []) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch (e) {
    if (e && e.code === 'ENOENT') return out
    throw e
  }
  for (const ent of entries) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) await collectFiles(p, out)
    else if (RASTER_EXT.has(path.extname(ent.name).toLowerCase())) out.push(p)
  }
  return out
}

async function optimizeOne(filePath, sharp) {
  const ext = path.extname(filePath).toLowerCase()
  const input = await fs.readFile(filePath)

  const meta = await sharp(input, { failOn: 'none' }).metadata()
  let pipeline = sharp(input, { failOn: 'none' })
  let didResize = false
  if (
    MAX_EDGE_PX > 0 &&
    meta.width &&
    meta.height &&
    Math.max(meta.width, meta.height) > MAX_EDGE_PX
  ) {
    pipeline = pipeline.resize({
      width: MAX_EDGE_PX,
      height: MAX_EDGE_PX,
      fit: 'inside',
      withoutEnlargement: true,
    })
    didResize = true
  }

  let out
  if (ext === '.jpg' || ext === '.jpeg') {
    out = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
  } else if (ext === '.png') {
    out = await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
  } else if (ext === '.webp') {
    out = await pipeline.webp({ quality: 82 }).toBuffer()
  } else {
    return { skipped: true, reason: 'extension' }
  }

  const smaller = out && out.length < input.length
  if (!didResize && !smaller) {
    return { skipped: true, reason: 'no gain', before: input.length, after: out?.length }
  }
  if (didResize && !smaller) {
    return {
      skipped: true,
      reason: 'resize not smaller (unexpected)',
      before: input.length,
      after: out?.length,
    }
  }
  await fs.writeFile(filePath, out)
  return { saved: true, before: input.length, after: out.length, resized: didResize }
}

async function main() {
  let sharp
  try {
    const mod = await import('sharp')
    sharp = mod.default
  } catch {
    console.warn(
      '[optimize-images] sharp не установлен. Выполните: npm install (в папке onboarding)',
    )
    process.exit(0)
  }

  const files = await collectFiles(ROOT)
  if (files.length === 0) {
    console.log(
      `[optimize-images] Нет файлов в ${path.relative(process.cwd(), ROOT) || 'public/images'}. Пропуск.`,
    )
    process.exit(0)
  }

  let totalBefore = 0
  let totalAfter = 0
  let changed = 0

  for (const f of files) {
    const rel = path.relative(path.join(__dirname, '..'), f)
    try {
      const r = await optimizeOne(f, sharp)
      if (r.saved) {
        changed++
        totalBefore += r.before
        totalAfter += r.after
        const pct = (((r.before - r.after) / r.before) * 100).toFixed(1)
        const tag = r.resized ? ' [+уменьшение]' : ''
        console.log(`[optimize-images] ${rel}  ${r.before} → ${r.after} bytes (−${pct}%)${tag}`)
      }
    } catch (err) {
      console.warn(`[optimize-images] Пропуск ${rel}:`, err.message || err)
    }
  }

  if (changed > 0) {
    const saved = totalBefore - totalAfter
    const pct = ((saved / totalBefore) * 100).toFixed(1)
    console.log(
      `[optimize-images] Готово: ${changed} файл(ов), суммарно −${saved} bytes (−${pct}%).`,
    )
  } else {
    console.log('[optimize-images] Все файлы уже сжаты или нечего улучшать.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
