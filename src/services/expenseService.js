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

  // ✅ Asegura userId desde auth si no viene en row.user_id
  let ensuredUserId = row?.user_id || null
  if (!ensuredUserId) {
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr) throw authErr
      ensuredUserId = authData?.user?.id || null
    } catch (e) {
      console.error('[gastos][insertExpense] No se pudo obtener userId:', e)
    }
  }

  // ✅ Normaliza nombres por si llegan variantes
  const payload = {
    monto: amount,
    categoria: row.category_key ?? row.categoria ?? null,
    fecha: row.occurred_on ?? row.fecha,
    descripcion: row.description ?? row.descripcion ?? null,
    user_id: ensuredUserId
  }

  // Log de depuración
  console.debug('[gastos][insertExpense] payload:', payload)

  const { error } = await supabase
    .from('gastos')
    .insert(payload)

  if (error) throw error

  const balance = await decreaseInitialAmount(ensuredUserId, amount)

  return { ok: true, balance }
}

/* ===========================
   list() para Histórico (ajustada)
   - Normaliza fechas a YYYY-MM-DD (columna 'fecha' es DATE).
   - Filtra por el usuario autenticado.
   - Deja una línea DEV opcional para incluir filas con user_id NULL.
=========================== */
export async function list(filter = {}) {
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr) throw authErr
  const userId = authData?.user?.id || null
  if (!userId) return []

  const dateOnly = (v) => (v ? String(v).slice(0, 10) : undefined)
  const from = dateOnly(filter.from)
  const to   = dateOnly(filter.to)
  const categories = Array.isArray(filter.categories) ? filter.categories : []

  let q = supabase
    .from('gastos')
    .select('id, monto, categoria, fecha, descripcion, user_id', { head: false })
    .eq('user_id', userId)
  // q = q.or(`user_id.eq.${userId},user_id.is.null`) // ← opcional migración

  if (from) q = q.gte('fecha', from)
  if (to)   q = q.lte('fecha', to)

  // ✅ saneo: solo aplicar .in si hay categorías válidas conocidas
  const allowed = new Set([
    ...presetCategories().map(c => c.key),
    ...additionalCategories().map(c => c.key)
  ])
  const catsFilter = categories.filter(k => allowed.has(k))

  if (catsFilter.length) {
    q = q.in('categoria', catsFilter)
  } else if (categories.length) {
    // Si pidieron categorías pero ninguna es válida para gastos,
    // no aplicamos filtro (equivale a "todas") para no devolver vacío por confusión.
    console.debug('[gastos][list] categorías ignoradas por no ser válidas en gastos:', categories)
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
