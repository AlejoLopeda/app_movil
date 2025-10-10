import { supabase } from '@/lib/supabaseClient'

export { getCurrentUserId, presetCategories, additionalCategories, resolveCategory } from '@/services/incomeService'

function sanitizeAmount(amount) {
  const numericValue = Number(amount)
  return Number.isFinite(numericValue) ? numericValue : 0
}

export async function insertExpense(row) {
  const amount = sanitizeAmount(row.amount)
  const payload = {
    monto: amount,
    categoria: row.category_key ?? null,
    fecha: row.occurred_on,
    descripcion: row.description ?? null,
    user_id: row.user_id
  }

  const { error } = await supabase.from('gastos').insert(payload)
  if (error) throw error

  return { ok: true }
}
