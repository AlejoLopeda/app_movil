// src/services/reportPdfService.js
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
pdfMake.vfs = pdfFonts.vfs

// Capacitor (para guardar/abrir en móvil)
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

// Carga perezosa de File Opener (opcional)
let fileOpenerCached = null
let fileOpenerLoaded = false
async function loadFileOpener () {
  if (fileOpenerLoaded) return fileOpenerCached
  fileOpenerLoaded = true
  try {
    const mod = await import('@capacitor-community/file-opener')
    fileOpenerCached = mod?.FileOpener || null
  } catch {
    fileOpenerCached = null
  }
  return fileOpenerCached
}

const nfCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
})

/* =============================
 *  Construcción del documento
 * ============================= */
export function buildReportDoc ({ kind, periodLabel, from, to, incomes, expenses }) {
  const balance = (incomes || 0) - (expenses || 0)
  const status =
    balance > 0 ? 'SALDO POSITIVO' :
    balance < 0 ? 'SALDO NEGATIVO' :
    'SALDO NEUTRO'

  const advice =
    balance > 0
      ? '¡Bien! Mantén el control: considera ahorrar un % de tu excedente.'
      : balance < 0
        ? 'Atención: revisa tus gastos y fija límites para equilibrar tus cuentas.'
        : 'Vas justo. Un pequeño ajuste en gastos o un ingreso extra mejorará tu balance.'

  const headerTitle = `REPORTE ${kind}`

  const rows = [
    [{ text: 'Concepto', style: 'th' }, { text: 'Valor', style: 'th', alignment: 'right' }],
    ['Ingresos', { text: nfCOP.format(incomes || 0), alignment: 'right' }],
    ['Gastos',   { text: nfCOP.format(expenses || 0), alignment: 'right' }],
    [{ text: status, bold: true }, { text: nfCOP.format(balance), alignment: 'right', bold: true }]
  ]

  return {
    pageSize: 'A4',
    pageMargins: [36, 48, 36, 48],
    content: [
      {
        columns: [
          { text: headerTitle, style: 'h1' },
          {
            stack: [
              { text: 'Finanzas App', style: 'brand' },
              { text: new Date().toLocaleString('es-CO'), style: 'tiny', color: '#777' }
            ],
            alignment: 'right'
          }
        ]
      },

      { text: `Período: ${periodLabel}`, margin: [0, 8, 0, 16], color: '#0b3a43' },

      {
        table: { widths: ['*', 120], body: rows },
        layout: {
          fillColor: (row) => (row === 0 ? '#e9f3f5' : null),
          hLineColor: () => '#cfd8dc',
          vLineColor: () => '#cfd8dc'
        }
      },

      {
        stack: [
          { text: 'Resumen', style: 'h2', margin: [0, 16, 0, 6] },
          {
            ul: [
              `Ingresos del período: ${nfCOP.format(incomes || 0)}`,
              `Gastos del período: ${nfCOP.format(expenses || 0)}`,
              `Balance: ${nfCOP.format(balance)}`
            ]
          }
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

/* ===== Helpers de generación (para previsualizar/guardar) ===== */

// Blob (útil para iframe / pdf.js)
export function makePdfBlob (docDefinition) {
  return new Promise((resolve, reject) => {
    try { pdfMake.createPdf(docDefinition).getBlob((blob) => resolve(blob)) }
    catch (e) { reject(e) }
  })
}

// Data URL (útil para web)
export function makePdfDataUrl (docDefinition) {
  return new Promise((resolve, reject) => {
    try { pdfMake.createPdf(docDefinition).getDataUrl((url) => resolve(url)) }
    catch (e) { reject(e) }
  })
}

// Nombre de archivo estandarizado
export function makeFileName (kind) {
  const slug =
    kind === 'DIARIO'   ? 'reporte-diario' :
    kind === 'SEMANAL'  ? 'reporte-semanal' :
    'reporte-mensual'
  return `${slug}-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`
}

// Web: descarga directa
export function downloadWeb (doc, name) {
  pdfMake.createPdf(doc).download(name)
}

// Nativo: guardar en Documentos y abrir/compartir
export async function saveNative (doc, name) {
  // Base64 “puro” (sin encabezado data:)
  const base64 = await new Promise((resolve, reject) => {
    try { pdfMake.createPdf(doc).getBase64(data => resolve(data)) }
    catch (e) { reject(e) }
  })

  const path = `reports/${name}`

  // Escribe en Documents (crea la subcarpeta con recursive)
  await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Documents,
    recursive: true
  })

  const { uri } = await Filesystem.getUri({ directory: Directory.Documents, path })

  // Intenta abrir con File Opener; si no está, comparte
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

/* ===== Compat: API antigua que solo descargaba (web) ===== */
export function downloadReportPdf (opts) {
  const doc = buildReportDoc(opts)
  const name = makeFileName(opts.kind)
  downloadWeb(doc, name)
}
