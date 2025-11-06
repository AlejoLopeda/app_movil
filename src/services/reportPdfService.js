// ANDROID ONLY – servicio PDF
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
pdfMake.vfs = pdfFonts.vfs

import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

// pdf.js (lazy) para render en canvas
let pdfjsLib = null
async function ensurePdfJs () {
  if (pdfjsLib) return pdfjsLib
  pdfjsLib = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
  return pdfjsLib
}

// File Opener (lazy)
let fileOpenerCached = null
let fileOpenerLoaded = false
async function loadFileOpener () {
  if (fileOpenerLoaded) return fileOpenerCached
  fileOpenerLoaded = true
  try {
    const mod = await import('@capacitor-community/file-opener')
    fileOpenerCached = mod?.FileOpener || null
  } catch { fileOpenerCached = null }
  return fileOpenerCached
}

const nfCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
})

/* ========== Documento ========== */
export function buildReportDoc ({ kind, periodLabel, from, to, incomes, expenses }) {
  const balance = (incomes || 0) - (expenses || 0)
  const status = balance > 0 ? 'SALDO POSITIVO' : balance < 0 ? 'SALDO NEGATIVO' : 'SALDO NEUTRO'
  const advice =
    balance > 0
      ? '¡Bien! Mantén el control: considera ahorrar un % de tu excedente.'
      : balance < 0
        ? 'Atención: revisa tus gastos y fija límites para equilibrar tus cuentas.'
        : 'Vas justo. Un pequeño ajuste en gastos o un ingreso extra mejorará tu balance.'

  return {
    pageSize: 'A4',
    pageMargins: [36, 48, 36, 48],
    content: [
      {
        columns: [
          { text: `REPORTE ${kind}`, style: 'h1' },
          { stack: [
              { text: 'Finanzas App', style: 'brand' },
              { text: new Date().toLocaleString('es-CO'), style: 'tiny', color: '#777' }
            ], alignment: 'right'
          }
        ]
      },
      { text: `Período: ${periodLabel}`, margin: [0, 8, 0, 16], color: '#0b3a43' },
      {
        table: {
          widths: ['*', 120],
          body: [
            [{ text: 'Concepto', style: 'th' }, { text: 'Valor', style: 'th', alignment: 'right' }],
            ['Ingresos', { text: nfCOP.format(incomes || 0), alignment: 'right' }],
            ['Gastos',   { text: nfCOP.format(expenses || 0), alignment: 'right' }],
            [{ text: status, bold: true }, { text: nfCOP.format(balance), alignment: 'right', bold: true }]
          ]
        },
        layout: {
          fillColor: (row) => (row === 0 ? '#e9f3f5' : null),
          hLineColor: () => '#cfd8dc',
          vLineColor: () => '#cfd8dc'
        }
      },
      {
        stack: [
          { text: 'Resumen', style: 'h2', margin: [0, 16, 0, 6] },
          { ul: [
            `Ingresos del período: ${nfCOP.format(incomes || 0)}`,
            `Gastos del período: ${nfCOP.format(expenses || 0)}`,
            `Balance: ${nfCOP.format(balance)}`
          ] }
        ]
      },
      { text: advice, margin: [0, 18, 0, 0], color: balance >= 0 ? '#2e7d32' : '#c62828' }
    ],
    styles: {
      h1: { fontSize: 18, bold: true, color: '#0b3a43' },
      h2: { fontSize: 14, bold: true, color: '#0b3a43' },
      th: { bold: true, color: '#0b3a43' },
      brand: { color: '#0b3a43', bold: true },
      tiny: { fontSize: 8 }
    },
    defaultStyle: { fontSize: 11, lineHeight: 1.25 }
  }
}

/* ========== Helpers ========== */
export function makeFileName (kind) {
  const slug = kind === 'DIARIO' ? 'reporte-diario'
    : kind === 'SEMANAL' ? 'reporte-semanal'
    : 'reporte-mensual'
  return `${slug}-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`
}

// Blob del PDF (para pdf.js)
export function buildPdfBlob (doc) {
  return new Promise((resolve, reject) => {
    try { pdfMake.createPdf(doc).getBlob(resolve) } catch (e) { reject(e) }
  })
}

// Render de la 1ª página al <canvas> (preview real)
export async function renderPdfToCanvas ({ doc, canvas, maxWidth = 900 }) {
  await ensurePdfJs()
  const blob = await buildPdfBlob(doc)
  const url  = URL.createObjectURL(blob)

  const pdf = await pdfjsLib.getDocument({ url }).promise
  const page = await pdf.getPage(1)

  const base = page.getViewport({ scale: 1 })
  const parentW = canvas?.parentElement?.clientWidth || base.width
  const scale = Math.min(maxWidth, parentW) / base.width
  const viewport = page.getViewport({ scale })

  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise

  URL.revokeObjectURL(url)
  return blob
}

// Guardar en Documentos y abrir/compartir
export async function saveNative (doc, name) {
  const base64 = await new Promise((resolve, reject) => {
    try { pdfMake.createPdf(doc).getBase64(data => resolve(data)) } catch (e) { reject(e) }
  })

  const path = `reports/${name}`
  await Filesystem.writeFile({ path, data: base64, directory: Directory.Documents, recursive: true })
  const { uri } = await Filesystem.getUri({ directory: Directory.Documents, path })

  try {
    const opener = await loadFileOpener()
    if (opener) {
      await opener.open({ filePath: uri, contentType: 'application/pdf' })
    } else {
      await Share.share({ title: name, text: 'Reporte PDF', url: uri, dialogTitle: 'Compartir reporte' })
    }
  } catch {
    await Share.share({ title: name, text: 'Reporte PDF', url: uri, dialogTitle: 'Compartir reporte' })
  }
  return uri
}
