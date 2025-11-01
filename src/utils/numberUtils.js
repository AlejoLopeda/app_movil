export function sanitizePositiveDecimalInput(raw) {
  if (raw == null) return ''
  const stringValue = String(raw)
  const digitsOnly = stringValue.replace(/[^0-9.,]/g, '')
  if (!digitsOnly) return ''

  const normalized = digitsOnly.replace(/,/g, '.')
  const segments = normalized.split('.')
  const integerSegment = segments.shift() || ''
  const decimalSegment = segments.join('')

  const cleanedInteger = integerSegment.replace(/^0+(?=\d)/, '')
  const hasDecimals = decimalSegment.length > 0

  let result = cleanedInteger
  if (!result) {
    if (!hasDecimals) return ''
    result = '0'
  }
  if (hasDecimals) {
    result += `.${decimalSegment}`
  }
  return result
}

export function parsePositiveNumber(value) {
  if (value == null || value === '') return null
  const normalized = String(value).replace(/,/g, '.')
  const parsed = Number.parseFloat(normalized)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

