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

const SPECIAL_CATEGORIES = Object.freeze({
  saldo_inicial: { key: 'saldo_inicial', label: 'Saldo inicial' }
})

export function presetCategories() {
  return DEFAULT_CATEGORIES.map((item) => ({ ...item }))
}

export function additionalCategories() {
  return ADDITIONAL_CATEGORIES.map((item) => ({ ...item }))
}

export function resolveCategory(key) {
  return (
    SPECIAL_CATEGORIES[key] ??
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

async function increaseInitialAmount(userId, amount) {
  if (!userId) return null

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('initial_amount')
    .eq('id', userId)
    .single()

  if (fetchError) throw fetchError

  const current = Number(profile?.initial_amount ?? 0)
  const delta = Number.isFinite(amount) ? amount : 0
  const next = Number.isFinite(current + delta) ? current + delta : current

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
    throw new Error(rpcData?.message || 'Failed to actualizar el monto inicial')
  }

  return next
}

export async function insertIncome(row) {
  const amount = sanitizeAmount(row.amount)
  const payload = {
    monto: amount,
    categoria: row.category_key ?? null,
    fecha: row.occurred_on,
    descripcion: row.description ?? null,
    user_id: row.user_id
  }

  const { error } = await supabase
    .from('ingresos')
    .insert(payload)

  if (error) throw error

  const balance = await increaseInitialAmount(row.user_id, amount)

  return { ok: true, balance }
}
