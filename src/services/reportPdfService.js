// src/services/reportPdfService.js
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
pdfMake.vfs = pdfFonts.vfs

const nfCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

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

export function makePdfBlob (docDefinition) {
  return new Promise((resolve, reject) => {
    try { pdfMake.createPdf(docDefinition).getBlob((blob) => resolve(blob)) }
    catch (e) { reject(e) }
  })
}

export function makePdfDataUrl (docDefinition) {
  return new Promise((resolve, reject) => {
    try { pdfMake.createPdf(docDefinition).getDataUrl((url) => resolve(url)) }
    catch (e) { reject(e) }
  })
}

export function downloadReportPdf (opts) {
  const doc = buildReportDoc(opts)
  const slug =
    opts.kind === 'DIARIO'   ? 'reporte-diario' :
    opts.kind === 'SEMANAL'  ? 'reporte-semanal' :
    'reporte-mensual'
  const name = `${slug}-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`
  pdfMake.createPdf(doc).download(name)
}
