import { supabase } from '@/lib/supabaseClient'
import { getCurrentUserId } from '@/services/incomeService'

function currencyFormatter() {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  })
}

export const formatCOP = (n) => currencyFormatter().format(Math.round(Number(n) || 0))

export async function listGoals() {
  const userId = await getCurrentUserId()
  if (!userId) return []

  const { data, error } = await supabase
    .from('v_metas_with_progress')
    .select('id, created_at, nombre, objetivo, user_id, descripcion, ahorrado, progreso_pct, cumplida')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map((g) => ({
    id: g.id,
    nombre: g.nombre,
    objetivo: Number(g.objetivo) || 0,
    ahorrado: Number(g.ahorrado) || 0,
    progreso_pct: Number(g.progreso_pct) || 0,
    cumplida: !!g.cumplida,
    descripcion: g.descripcion || null,
    created_at: g.created_at
  }))
}

export async function getGoalById(id) {
  const userId = await getCurrentUserId()
  if (!userId) return null
  const { data, error } = await supabase
    .from('v_metas_with_progress')
    .select('id, created_at, nombre, objetivo, user_id, descripcion, ahorrado, progreso_pct, cumplida')
    .eq('user_id', userId)
    .eq('id', id)
    .single()
  if (error) throw error
  return {
    id: data.id,
    nombre: data.nombre,
    objetivo: Number(data.objetivo) || 0,
    ahorrado: Number(data.ahorrado) || 0,
    progreso_pct: Number(data.progreso_pct) || 0,
    cumplida: !!data.cumplida,
    descripcion: data.descripcion || null,
    created_at: data.created_at
  }
}

export async function createGoal({ nombre, monto, descripcion }) {
  const { data, error } = await supabase.rpc('fn_create_meta', {
    p_nombre: nombre,
    p_monto: Number(monto),
    p_descripcion: descripcion || null
  })
  if (error) throw error
  return data
}

export async function updateGoal({ id, nombre, monto, descripcion }) {
  const { data, error } = await supabase.rpc('fn_update_meta', {
    p_meta_id: Number(id),
    p_nombre: nombre,
    p_monto: Number(monto),
    p_descripcion: descripcion || null
  })
  if (error) throw error
  return data
}

export async function deleteGoal(id) {
  const { error } = await supabase.rpc('fn_delete_meta', { p_meta_id: Number(id) })
  if (error) throw error
  return { ok: true }
}

function formatSupabaseError(error) {
  if (!error) return 'Error desconocido'
  // Supabase v2 error can include details/hint/message
  const parts = [error.message, error.details, error.hint].filter(Boolean)
  return parts.join(' — ')
}

export async function depositToGoal({ metaId, amount, description }) {
  const { data, error } = await supabase.rpc('fn_goal_transfer', {
    p_meta_id: Number(metaId),
    p_amount: Number(amount),
    p_description: description || null,
    p_direction: 'to_goal'
  })
  if (error) {
    console.error('[fn_goal_transfer][to_goal] error:', error)
    throw new Error(formatSupabaseError(error))
  }
  return data?.[0] || null
}

export async function withdrawFromGoal({ metaId, amount, description }) {
  const { data, error } = await supabase.rpc('fn_goal_transfer', {
    p_meta_id: Number(metaId),
    p_amount: Number(amount),
    p_description: description || null,
    p_direction: 'from_goal'
  })
  if (error) {
    console.error('[fn_goal_transfer][from_goal] error:', error)
    throw new Error(formatSupabaseError(error))
  }
  return data?.[0] || null
}

export async function listGoalTransactions(metaId) {
  const userId = await getCurrentUserId()
  if (!userId) return []
  const { data, error } = await supabase
    .from('meta_transactions')
    .select('id, amount, description, created_at')
    .eq('meta_id', Number(metaId))
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((t) => ({
    id: t.id,
    amount: Number(t.amount) || 0,
    description: t.description || '',
    created_at: t.created_at
  }))
}
