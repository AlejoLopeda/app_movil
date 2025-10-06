import { supabase } from '@/lib/supabaseClient'

const DEFAULT_CATEGORIES = Object.freeze([
  { key: 'salario', label: 'Salario' },
  { key: 'regalos', label: 'Regalos' },
  { key: 'pension', label: 'Pension' },
  { key: 'otros', label: 'Otros' }
])

export function presetCategories() {
  return DEFAULT_CATEGORIES.map((item) => ({ ...item }))
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
