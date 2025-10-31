import { supabase } from '@/lib/supabaseClient'

// ======================
// Categorías
// ======================
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
    DEFAULT_CATEGORIES.find((i) => i.key === key) ??
    ADDITIONAL_CATEGORIES.find((i) => i.key === key) ??
    null
  )
}

// ======================
// Helpers
// ======================
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

  // Fallback por si hay política de actualización
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

// ======================
// Insertar gasto
// ======================
export async function insertExpense(row) {
  const amount = sanitizeAmount(row.amount ?? row.monto)

  // ✅ userId llega desde el compositor; mantenemos fallbacks livianos
  let ensuredUserId = row?.user_id || ''
  if (!ensuredUserId) {
    try {
      const { useAuthUser } = await import('@/composables/useAuthUser')
      const { userId } = useAuthUser()
      ensuredUserId = userId()
    } catch (_) {}
  }
  if (!ensuredUserId) {
    // último recurso (solo si es absolutamente necesario)
    try {
      const { data } = await supabase.auth.getUser()
      ensuredUserId = data?.user?.id || ''
    } catch (_) {}
  }
  if (!ensuredUserId) {
    const err = new Error('auth-missing')
    err.code = 'PGRST301'
    throw err
  }

  // Normaliza nombres por si llegan variantes
  const payload = {
    monto: amount,
    categoria: row.category_key ?? row.categoria ?? null,
    fecha: row.occurred_on ?? row.fecha,
    descripcion: row.description ?? row.descripcion ?? null,
    user_id: ensuredUserId
  }

  console.debug('[gastos][insertExpense] payload:', payload)

  const { error } = await supabase.from('gastos').insert(payload)
  if (error) throw error

  const balance = await decreaseInitialAmount(ensuredUserId, amount)
  return { ok: true, balance }
}

// ======================
// Listado (para Histórico)
// ======================
export async function list(filter = {}) {
  // ✅ sin llamadas repetidas: usa useAuthUser
  let userId = ''
  try {
    const { useAuthUser } = await import('@/composables/useAuthUser')
    const { userId: uid } = useAuthUser()
    userId = uid()
  } catch (_) {}

  if (!userId) return []

  const dateOnly = (v) => (v ? String(v).slice(0, 10) : undefined)
  const from = dateOnly(filter.from)
  const to   = dateOnly(filter.to)
  const categories = Array.isArray(filter.categories) ? filter.categories : []

  let q = supabase
    .from('gastos')
    .select('id, monto, categoria, fecha, descripcion, user_id', { head: false })
    .eq('user_id', userId)

  if (from) q = q.gte('fecha', from)
  if (to)   q = q.lte('fecha', to)

  const allowed = new Set([
    ...presetCategories().map(c => c.key),
    ...additionalCategories().map(c => c.key)
  ])
  const catsFilter = categories.filter(k => allowed.has(k))
  if (catsFilter.length) {
    q = q.in('categoria', catsFilter)
  } else if (categories.length) {
    console.debug('[gastos][list] categorías ignoradas (no válidas para gastos):', categories)
  }

  q = q.order('fecha', { ascending: false }).order('id', { ascending: false })

  const { data, error } = await q
  if (error) {
    console.error('[gastos][list] error:', error)
    throw error
  }

  console.debug('[gastos][list] userId:', userId, 'from:', from, 'to:', to, 'rows:', data?.length ?? 0, 'cats:', catsFilter)

  return (data || []).map(r => ({
    id: r.id,
    monto: r.monto,
    categoria: r.categoria,
    fecha: r.fecha,
    descripcion: r.descripcion
  }))
}
