import { supabase } from '@/lib/supabaseClient'
// Reuse only auth helper from income service
export { getCurrentUserId } from '@/services/incomeService'

// Expense categories (split between main view and modal)
const DEFAULT_CATEGORIES = Object.freeze([
  { key: 'transporte', label: 'Transporte' },
  { key: 'hogar', label: 'Hogar' },
  { key: 'comida', label: 'Comida' },
])

const ADDITIONAL_CATEGORIES = Object.freeze([
  { key: 'educacion', label: 'Educación' },
  { key: 'entretenimiento', label: 'Entretenimiento' },
  { key: 'ropa', label: 'Ropa' },
  { key: 'viajes', label: 'Viajes' },
  { key: 'mascotas', label: 'Mascotas' },
  { key: 'salud', label: 'Salud' },
  { key: 'otros', label: 'Otros' },
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

function sanitizeAmount(amount) {
  const numericValue = Number(amount)
  return Number.isFinite(numericValue) ? numericValue : 0
}

async function decreaseInitialAmount(userId, amount) {
  if (!userId) return null

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('initial_amount')
    .eq('id', userId)
    .single()

  if (fetchError) throw fetchError

  const current = Number(profile?.initial_amount ?? 0)
  const delta = Number.isFinite(amount) ? amount : 0
  const next = Number.isFinite(current - delta) ? current - delta : current

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ initial_amount: next })
    .eq('id', userId)
    .select('initial_amount')
    .single()

  if (!updateError) {
    return Number(updated?.initial_amount ?? next)
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc('set_initial_amount', {
    p_amount: next,
    p_currency: 'COP'
  })

  if (rpcError) throw rpcError
  if (rpcData && rpcData.ok === false) {
    throw new Error(rpcData?.message || 'Failed to update initial amount')
  }

  return next
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

  const { error } = await supabase
    .from('gastos')
    .insert(payload)

  if (error) throw error

  const balance = await decreaseInitialAmount(row.user_id, amount)

  return { ok: true, balance }
}
