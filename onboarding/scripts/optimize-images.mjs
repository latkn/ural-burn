/**
 * Сжимает растровые изображения:
 * - public/images (лендинг)
 * - src/assets/gallery (полноразмер для лайтбокса)
 * - public/gallery-thumbs (превью для сетки галереи)
 * SVG не трогает.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT = path.join(__dirname, '..')
const PUBLIC_IMAGES = path.join(PROJECT, 'public', 'images')
const GALLERY_SRC = path.join(PROJECT, 'src', 'assets', 'gallery')
const GALLERY_THUMBS = path.join(PROJECT, 'public', 'gallery-thumbs')

const PUBLIC_MAX_EDGE = Number(process.env.OPTIMIZE_IMAGES_MAX_EDGE ?? 1920)
const GALLERY_MAX_EDGE = Number(process.env.OPTIMIZE_GALLERY_MAX_EDGE ?? 1600)
const THUMB_MAX_EDGE = Number(process.env.OPTIMIZE_GALLERY_THUMB_EDGE ?? 480)
const THUMB_QUALITY = Number(process.env.OPTIMIZE_GALLERY_THUMB_QUALITY ?? 76)

const RASTER_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

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

function thumbBasename(filePath) {
  const base = path.basename(filePath, path.extname(filePath))
  return base.replace(/[^a-zA-Z0-9._-]+/g, '_') + '.jpg'
}

async function optimizeOne(filePath, sharp, maxEdgePx) {
  const ext = path.extname(filePath).toLowerCase()
  const input = await fs.readFile(filePath)

  const meta = await sharp(input, { failOn: 'none' }).metadata()
  let pipeline = sharp(input, { failOn: 'none' })
  let didResize = false
  if (
    maxEdgePx > 0 &&
    meta.width &&
    meta.height &&
    Math.max(meta.width, meta.height) > maxEdgePx
  ) {
    pipeline = pipeline.resize({
      width: maxEdgePx,
      height: maxEdgePx,
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
  } else if (ext === '.gif') {
    out = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
    if (out) {
      const jpgPath = filePath.replace(/\.gif$/i, '.jpg')
      if (jpgPath !== filePath) {
        await fs.writeFile(jpgPath, out)
        await fs.unlink(filePath).catch(() => {})
        return { saved: true, before: input.length, after: out.length, converted: 'gif→jpg' }
      }
    }
    return { skipped: true, reason: 'gif' }
  } else {
    return { skipped: true, reason: 'extension' }
  }

  const smaller = out && out.length < input.length
  if (!didResize && !smaller) {
    return { skipped: true, reason: 'no gain', before: input.length, after: out?.length }
  }
  if (didResize && !smaller) {
    await fs.writeFile(filePath, out)
    return { saved: true, before: input.length, after: out.length, resized: true, forced: true }
  }
  await fs.writeFile(filePath, out)
  return { saved: true, before: input.length, after: out.length, resized: didResize }
}

/** Фото-PNG без альфы → JPEG (меньше вес при том же визуале). */
async function convertLargeRgbPngToJpeg(filePath, sharp) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext !== '.png') return null

  const input = await fs.readFile(filePath)
  if (input.length < 350_000) return null

  let pipeline = sharp(input, { failOn: 'none' })
  const meta = await pipeline.metadata()
  if (meta.hasAlpha) {
    pipeline = sharp(input, { failOn: 'none' }).flatten({ background: '#0a0a0a' })
  }
  const edge = Math.min(PUBLIC_MAX_EDGE, 1600)
  if (meta.width && meta.height && Math.max(meta.width, meta.height) > edge) {
    pipeline = pipeline.resize({
      width: edge,
      height: edge,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  const jpg = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
  if (!jpg || jpg.length >= input.length) return null

  const jpgPath = filePath.replace(/\.png$/i, '.jpg')
  await fs.writeFile(jpgPath, jpg)
  await fs.unlink(filePath)
  return { from: filePath, to: jpgPath, before: input.length, after: jpg.length }
}

async function writeGalleryThumb(sourcePath, sharp) {
  const input = await fs.readFile(sourcePath)
  const out = await sharp(input, { failOn: 'none' })
    .resize({
      width: THUMB_MAX_EDGE,
      height: THUMB_MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
    .toBuffer()

  await fs.mkdir(GALLERY_THUMBS, { recursive: true })
  const dest = path.join(GALLERY_THUMBS, thumbBasename(sourcePath))
  await fs.writeFile(dest, out)
  return { dest, bytes: out.length }
}

async function processDir(label, dir, sharp, maxEdgePx, opts = {}) {
  const files = await collectFiles(dir)
  if (files.length === 0) {
    console.log(`[optimize-images] ${label}: нет файлов, пропуск.`)
    return
  }

  let totalBefore = 0
  let totalAfter = 0
  let changed = 0

  for (const f of files) {
    const rel = path.relative(PROJECT, f)
    try {
      if (opts.convertRgbPng) {
        const conv = await convertLargeRgbPngToJpeg(f, sharp)
        if (conv) {
          changed++
          totalBefore += conv.before
          totalAfter += conv.after
          const pct = (((conv.before - conv.after) / conv.before) * 100).toFixed(1)
          console.log(
            `[optimize-images] ${path.relative(PROJECT, conv.from)} → ${path.relative(PROJECT, conv.to)} (−${pct}%, PNG→JPEG)`,
          )
          continue
        }
      }

      const r = await optimizeOne(f, sharp, maxEdgePx)
      if (r.saved) {
        changed++
        totalBefore += r.before
        totalAfter += r.after
        const pct = (((r.before - r.after) / r.before) * 100).toFixed(1)
        const tag = r.resized ? ' [resize]' : r.converted ? ` [${r.converted}]` : ''
        console.log(`[optimize-images] ${rel}  ${r.before} → ${r.after} bytes (−${pct}%)${tag}`)
      }

      if (opts.thumbs) {
        let thumbSource = f
        if (/\.gif$/i.test(f)) {
          const jpgAlt = f.replace(/\.gif$/i, '.jpg')
          try {
            await fs.access(jpgAlt)
            thumbSource = jpgAlt
          } catch {
            thumbSource = null
          }
        }
        if (thumbSource) {
          try {
            const t = await writeGalleryThumb(thumbSource, sharp)
            console.log(
              `[optimize-images] thumb ${path.relative(PROJECT, t.dest)} (${t.bytes} bytes)`,
            )
          } catch (err) {
            console.warn(`[optimize-images] thumb fail ${rel}:`, err.message || err)
          }
        }
      }
    } catch (err) {
      console.warn(`[optimize-images] Пропуск ${rel}:`, err.message || err)
    }
  }

  if (changed > 0) {
    const saved = totalBefore - totalAfter
    const pct = ((saved / totalBefore) * 100).toFixed(1)
    console.log(`[optimize-images] ${label}: ${changed} файл(ов), −${saved} bytes (−${pct}%).`)
  } else {
    console.log(`[optimize-images] ${label}: без изменений.`)
  }
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

  await processDir('public/images', PUBLIC_IMAGES, sharp, PUBLIC_MAX_EDGE, {
    convertRgbPng: true,
  })
  await processDir('src/assets/gallery', GALLERY_SRC, sharp, GALLERY_MAX_EDGE, {
    thumbs: true,
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
