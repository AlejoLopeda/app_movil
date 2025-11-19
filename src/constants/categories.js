// Centralized category definitions used across filters and forms.
// Keep ordering in sync with the Monthly filter UI.

export const INCOME_PRESET = Object.freeze([
  { key: 'salario',  label: 'Salario' },
  { key: 'regalos',  label: 'Regalos' },
  { key: 'pension',  label: 'Pension' },
])

export const INCOME_EXTRA = Object.freeze([
  { key: 'comisiones',  label: 'Comisiones' },
  { key: 'propinas',    label: 'Propinas' },
  { key: 'reembolsos',  label: 'Reembolsos' },
  { key: 'ventas',      label: 'Ventas' },
  { key: 'mesada',      label: 'Mesada' },
  { key: 'otros',       label: 'Otros' },
])

// Antes tenía { key: 'saldo_inicial', label: 'Saldo inicial' }
// Se deja vacío para no romper imports existentes.
export const INCOME_SPECIAL = Object.freeze([])

export const EXPENSE_PRESET = Object.freeze([
  { key: 'transporte', label: 'Transporte' },
  { key: 'hogar',      label: 'Hogar' },
  { key: 'comida',     label: 'Comida' },
])

export const EXPENSE_EXTRA = Object.freeze([
  { key: 'educacion',       label: 'Educación' },
  { key: 'entretenimiento', label: 'Entretenimiento' },
  { key: 'ropa',            label: 'Ropa' },
  { key: 'viajes',          label: 'Viajes' },
  { key: 'mascotas',        label: 'Mascotas' },
  { key: 'salud',           label: 'Salud' },
  { key: 'otros',           label: 'Otros' },
])

export function allIncomeCategories() {
  // Ya no incluye saldo inicial
  return [...INCOME_PRESET, ...INCOME_EXTRA /*, ...INCOME_SPECIAL */]
}

export function allExpenseCategories() {
  return [...EXPENSE_PRESET, ...EXPENSE_EXTRA]
}

export function findIncomeCategory(key) {
  const k = String(key || '').trim()
  if (!k) return null
  return (
    INCOME_PRESET.find(i => i.key === k) ||
    INCOME_EXTRA.find(i => i.key === k) ||
    INCOME_SPECIAL.find(i => i.key === k) || // no pasa nada, está vacío
    null
  )
}

export function findExpenseCategory(key) {
  const k = String(key || '').trim()
  if (!k) return null
  return (
    EXPENSE_PRESET.find(i => i.key === k) ||
    EXPENSE_EXTRA.find(i => i.key === k) ||
    null
  )
}


