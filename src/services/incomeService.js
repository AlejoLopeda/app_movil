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

/* =========================
 * NUEVO: listar ingresos
 * ========================= */
export async function list(filter = {}) {
  const { from, to, categories } = filter
  const userId = await getCurrentUserId()
  if (!userId) return []

  // consulta base
  let query = supabase
    .from('ingresos')
    .select('id, monto, categoria, fecha, descripcion, user_id')
    .eq('user_id', userId)
    .order('fecha', { ascending: false })

  // filtros opcionales
  if (from) query = query.gte('fecha', String(from).slice(0, 10))
  if (to)   query = query.lte('fecha', String(to).slice(0, 10))
  if (categories && categories.length) query = query.in('categoria', categories)

  const { data, error } = await query
  if (error) {
    console.error('[incomeService][list] error:', error)
    throw error
  }

  // normalizar resultado
  return (data || []).map((x) => ({
    id: x.id,
    monto: Number(x.monto) || 0,
    categoria: x.categoria || null,
    fecha: x.fecha,
    descripcion: x.descripcion || '',
    user_id: x.user_id
  }))
}

