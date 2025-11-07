// src/services/incomeService.js
import { supabase } from '@/lib/supabaseClient'
import { useAuthUser } from '@/composables/useAuthUser'

const DEFAULT_CATEGORIES = Object.freeze([
  { key: 'salario', label: 'Salario' },
  { key: 'regalos', label: 'Regalos' },
  { key: 'pension', label: 'Pension' },
])

const ADDITIONAL_CATEGORIES = Object.freeze([
  { key: 'comisiones', label: 'Comisiones' },
  { key: 'propinas', label: 'Propinas' },
  { key: 'reembolsos', label: 'Reembolsos' },
  { key: 'ventas', label: 'Ventas' },
  { key: 'mesada', label: 'Mesada' },
  { key: 'otros', label: 'Otros' },
])

const SPECIAL_CATEGORIES = Object.freeze({
  saldo_inicial: { key: 'saldo_inicial', label: 'Saldo inicial' },
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

/** ✅ sin request: usa auth global en memoria */
export async function getCurrentUserId() {
  const { userId } = useAuthUser()
  return userId() || null
}

function sanitizeAmount(amount) {
  const numericValue = Number(amount)
  return Number.isFinite(numericValue) ? numericValue : 0
}

/** ✅ Primero intenta RPC (1 llamada). Si no existe, cae a SELECT+UPDATE. */
async function increaseInitialAmount(userId, amount) {
  if (!userId) return null
  const delta = Number.isFinite(amount) ? Number(amount) : 0

  // 1) RPC recomendado: inc_initial_amount(p_delta numeric, p_currency text)
  try {
    const { data, error } = await supabase.rpc('inc_initial_amount', {
      p_delta: delta,
      p_currency: 'COP',
    })
    if (error) throw error
    // Si tu RPC devuelve el nuevo saldo, úsalo. Si no, ignóralo.
    return typeof data === 'number' ? data : null
  } catch (_e) {
    // Si el RPC no existe, usa flujo anterior
  }

  // 2) Fallback: SELECT + UPDATE
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('initial_amount')
    .eq('id', userId)
    .single()
  if (fetchError) throw fetchError

  const current = Number(profile?.initial_amount ?? 0)
  const next = Number.isFinite(current + delta) ? current + delta : current

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ initial_amount: next })
    .eq('id', userId)
    .select('initial_amount')
    .single()
  if (updateError) throw updateError

  return Number(updated?.initial_amount ?? next)
}

export async function insertIncome(row) {
  const amount = sanitizeAmount(row.amount)
  const payload = {
    monto: amount,
    categoria: row.category_key ?? null,
    fecha: row.occurred_on,
    descripcion: row.description ?? null,
    user_id: row.user_id,
  }

  const { error } = await supabase.from('ingresos').insert(payload)
  if (error) throw error

  const balance = await increaseInitialAmount(row.user_id, amount)
  return { ok: true, balance }
}

/* ============ LISTAR (con de-dup y límite) ============ */
const inflight = new Map() // key => Promise

export async function list(filter = {}, paging = { limit: 100, offset: 0 }) {
  const uid = await getCurrentUserId()
  if (!uid) return []

  const { from, to, categories } = filter
  const limit = Number.isFinite(paging?.limit) ? Math.max(1, paging.limit) : 100
  const offset = Number.isFinite(paging?.offset) ? Math.max(0, paging.offset) : 0

  // clave de-dedupe por usuario+filtros+paginación
  const key = JSON.stringify({ uid, from, to, categories, limit, offset })
  if (inflight.has(key)) return inflight.get(key)

  const p = (async () => {
    try {
      let query = supabase
        .from('ingresos')
        .select('id, monto, categoria, fecha, descripcion, user_id', { count: 'exact' })
        .eq('user_id', uid)
        .order('fecha', { ascending: false })
        .range(offset, offset + limit - 1) // ✅ paginación segura

      if (from)        query = query.gte('fecha', String(from).slice(0, 10))
      if (to)          query = query.lte('fecha', String(to).slice(0, 10))
      if (categories?.length) query = query.in('categoria', categories)

      const { data, error } = await query
      if (error) throw error

      return (data || []).map((x) => ({
        id: x.id,
        monto: Number(x.monto) || 0,
        categoria: x.categoria || null,
        fecha: x.fecha,
        descripcion: x.descripcion || '',
        user_id: x.user_id,
      }))
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}
