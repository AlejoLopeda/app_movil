export function normalizeDateStr(d) {
  if (!d) return ''
  if (typeof d === 'string') return d.slice(0, 10)
  try { return new Date(d).toISOString().slice(0, 10) } catch { return '' }
}

export function formatDate(d) {
  const ymd = normalizeDateStr(d)
  if (!ymd) return '—'
  const [y, m, day] = ymd.split('-')
  return `${day}/${m}/${y}`
}
