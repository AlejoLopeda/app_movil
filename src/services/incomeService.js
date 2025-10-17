import { supabase } from '@/lib/supabaseClient'

const DEFAULT_CATEGORIES = Object.freeze([
  { key: 'salario', label: 'Salario' },
  { key: 'regalos', label: 'Regalos' },
  { key: 'pension', label: 'Pension' }
])

const ADDITIONAL_CATEGORIES = Object.freeze([
  { key: 'comisiones', label: 'Comisiones' },
  { key: 'propinas', label: 'Propinas' },
  { key: 'reembolsos', label: 'Reembolsos' },
  { key: 'ventas', label: 'Ventas' },
  { key: 'mesada', label: 'Mesada' },
  { key: 'otros', label: 'Otros' }
])

export function presetCategories() {
  return DEFAULT_CATEGORIES.map((item) => ({ ...item }))
}

export function additionalCategories() {
  return ADDITIONAL_CATEGORIES.map((item) => ({ ...item }))
}

export function resolveCategory(key) {
  return (
    DEFAULT_CATEGORIES.find((item) => item.key === key) ??
    ADDITIONAL_CATEGORIES.find((item) => item.key === key) ??
    null
  )
}

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data?.user?.id ?? null
}

function sanitizeAmount(amount) {
  const numericValue = Number(amount)
  return Number.isFinite(numericValue) ? numericValue : 0
}

export async function insertIncome(row) {
  const amount = sanitizeAmount(row.amount)
  const payload = {
    p_monto: amount,
    p_categoria: row.category_key ?? null,
    p_fecha: row.occurred_on,
    p_descripcion: row.description ?? null
  }

  const { data, error } = await supabase.rpc('record_income', payload)
  if (error) throw error

  return { ok: true, balance: data ?? amount }
}
