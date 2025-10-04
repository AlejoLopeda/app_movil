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

export async function insertIncome(row) {
  const payload = {
    amount: row.amount,
    category_key: row.category_key ?? null,
    occurred_on: row.occurred_on,
    description: row.description ?? null,
    user_id: row.user_id
  }

  const { error } = await supabase.from('incomes').insert(payload)
  if (error) throw error
  return { ok: true }
}
