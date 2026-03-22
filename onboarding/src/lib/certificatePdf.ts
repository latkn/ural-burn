import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Рендерит DOM-элемент в PDF (A4). Подходит для кириллицы при использовании веб-шрифтов на странице.
 */
export async function downloadCertificatePdf(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#0c0c0c',
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const imgData = canvas.toDataURL('image/png', 1.0)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pdfW = pdf.internal.pageSize.getWidth()
  const pdfH = pdf.internal.pageSize.getHeight()
  const imgWmm = pdfW
  const imgHmm = (canvas.height * pdfW) / canvas.width

  if (imgHmm <= pdfH) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgWmm, imgHmm, undefined, 'FAST')
  } else {
    const scaledW = (canvas.width * pdfH) / canvas.height
    const x = (pdfW - scaledW) / 2
    pdf.addImage(imgData, 'PNG', x, 0, scaledW, pdfH, undefined, 'FAST')
  }

  pdf.save(filename)
}
