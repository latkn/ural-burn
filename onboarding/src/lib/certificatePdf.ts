import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

function isAppleMobile(): boolean {
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const iPadOS13Plus = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return iOS || iPadOS13Plus
}

/** Safari (в т.ч. macOS): после долгого await программный download часто режется как «не по жесту». */
function isWebKitSafari(): boolean {
  const ua = navigator.userAgent
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|Android|OPR|Opera/i.test(ua)
}

/**
 * Нужен второй явный тап пользователя перед сохранением файла:
 * iOS/iPadOS, встроенные браузеры (TG/Instagram и т.д.), Safari.
 */
export function needsDeferredPdfSave(): boolean {
  if (isAppleMobile()) return true
  if (isWebKitSafari()) return true
  const ua = navigator.userAgent
  if (/Instagram|FBAN|FBAV|FB_IAB|MicroMessenger|TikTok|Line\//i.test(ua)) return true
  return false
}

/**
 * Снимок вне родителя с overflow — иначе html2canvas на iOS часто даёт обрезанный/сдвинутый кадр.
 * Контейнер off-screen с явной шириной/высотой, иначе клон в 0×0 схлопнется.
 */
function captureShell(element: HTMLElement): { clone: HTMLElement; cleanup: () => void } {
  const w = element.offsetWidth || element.scrollWidth
  const h = element.offsetHeight || element.scrollHeight

  const root = document.createElement('div')
  root.setAttribute('aria-hidden', 'true')
  root.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${w}px`,
    `height:${h}px`,
    'overflow:visible',
    'pointer-events:none',
    'z-index:0',
  ].join(';')

  const clone = element.cloneNode(true) as HTMLElement
  clone.style.boxSizing = 'border-box'
  clone.style.margin = '0'
  clone.style.transform = 'none'

  root.appendChild(clone)
  document.body.appendChild(root)

  return {
    clone,
    cleanup: () => {
      root.remove()
    },
  }
}

export function downloadBlobAsFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2500)
}

/**
 * Собирает PDF в память. Сохранение на диск — отдельным синхронным действием пользователя
 * (см. needsDeferredPdfSave), иначе iOS/Safari часто блокируют загрузку после await.
 */
export async function buildCertificatePdfBlob(element: HTMLElement): Promise<Blob> {
  if (document.fonts?.ready) {
    await document.fonts.ready
  }

  const { clone, cleanup } = captureShell(element)

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0c0c0c',
      logging: false,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      foreignObjectRendering: false,
    })

    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()
    const imgWmm = pdfW
    const imgHmm = (canvas.height * pdfW) / canvas.width

    if (imgHmm <= pdfH) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWmm, imgHmm, undefined, 'NONE')
    } else {
      const scaledW = (canvas.width * pdfH) / canvas.height
      const x = (pdfW - scaledW) / 2
      pdf.addImage(imgData, 'PNG', x, 0, scaledW, pdfH, undefined, 'NONE')
    }

    return pdf.output('blob')
  } finally {
    cleanup()
  }
}
