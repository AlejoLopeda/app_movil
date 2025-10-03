import { ref, computed } from 'vue'
const MAX_AMOUNT = 9999999999.99
const MIN_AMOUNT = 100000 // ⬅️ añadido: mínimo permitido
const localeDecimal = (1.1).toLocaleString().includes(',') ? ',' : '.'

function normalizeNumberString(input) {
  let v = (input ?? '').trim()
  if (!v) return ''
  if (!/^[\d\s.,+\-]+$/.test(v)) return 'NaN'
  v = v.replace(/\s+/g, '')
  const lc = v.lastIndexOf(','), ld = v.lastIndexOf('.')
  const last = Math.max(lc, ld)
  if (last === -1) return v.replace(/[.,](?=\d{3}\b)/g, '')
  const dec = v[last]
  const int = v.slice(0, last).replace(/[.,]/g, '')
  const frac = v.slice(last + 1)
  return `${int}${dec}${frac}`
}

export function useInitialAmount() {
  const raw = ref('')
  const touched = ref(false)
  const loading = ref(false)
  const err = ref(null)

  const parsed = computed(() => {
    const v = raw.value.trim()
    if (!v) return null
    const nrm = normalizeNumberString(v)
    if (nrm === 'NaN') return NaN
    const hasC = nrm.includes(','), hasD = nrm.includes('.')
    if ((hasC ^ hasD) && (hasC ? ',' : '.') !== localeDecimal) return 'BAD_LOCALE'
    const asPoint = nrm.replace(',', '.')
    const m = asPoint.match(/^\s*([+-]?\d+)(?:\.(\d+))?\s*$/)
    if (!m) return NaN
    const frac = m[2] ?? ''
    if (frac.length > 2) return 'TOO_MANY_DECIMALS'
    const n = Number(asPoint)
    return Number.isFinite(n) ? n : NaN
  })

  const isEmpty = computed(() => raw.value.trim() === '')
  const isInvalid = computed(() => {
    if (isEmpty.value) return false
    if (parsed.value === null || Number.isNaN(parsed.value)) return true
    if (parsed.value === 'BAD_LOCALE' || parsed.value === 'TOO_MANY_DECIMALS') return true
    const n = parsed.value
    return n < 0 || n > MAX_AMOUNT || n < MIN_AMOUNT // ⬅️ añadido: validar mínimo
  })

  const showError = computed(() =>
    (touched.value && (isEmpty.value || isInvalid.value)) ||
    (!touched.value && !isEmpty.value && isInvalid.value)
  )

  const errorMsg = computed(() => {
    if (!showError.value) return ''
    if (isEmpty.value) return 'El monto es obligatorio.'
    if (parsed.value === 'BAD_LOCALE') return `Usa el separador decimal "${localeDecimal}".`
    if (parsed.value === 'TOO_MANY_DECIMALS') return 'Máximo 2 decimales.'
    if (Number.isNaN(parsed.value)) return 'Solo números. Puedes pegar 1.200,50 o 1,200.50.'
    const n = parsed.value
    if (n > MAX_AMOUNT) return 'Monto fuera de rango.'
    if (n < 0) return 'El monto no puede ser negativo.'
    if (n < MIN_AMOUNT) return 'El monto mínimo es 100.000.' // ⬅️ añadido: mensaje mínimo
    return 'Ingresa un monto válido.'
  })

  const canSubmit = computed(() =>
    !isEmpty.value && !isInvalid.value && parsed.value !== null && !Number.isNaN(parsed.value)
  )

  return { raw, touched, loading, err, parsed, isEmpty, isInvalid, showError, errorMsg, canSubmit }
}
