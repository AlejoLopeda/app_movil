import { supabase } from './supabaseClient'

export type NewIncome = {
  monto: number
  categoria?: string | null
  fecha: string // ISO date string: YYYY-MM-DD
  descripcion?: string | null
}

export async function addIncome(payload: NewIncome) {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id

  const baseRow: Record<string, any> = {
    monto: payload.monto,
    categoria: payload.categoria ?? null,
    fecha: payload.fecha,
    descripcion: payload.descripcion ?? null,
  }

  // Intenta insertar con user_id si existe RLS por usuario.
  try {
    const rowWithUser = uid ? { ...baseRow, user_id: uid } : baseRow
    const { data, error } = await supabase.from('ingresos').insert([rowWithUser]).select()
    if (error) throw error
    return data
  } catch (e: any) {
    // Si la columna user_id no existe, reintenta sin ella.
    const msg = String(e?.message ?? '')
    if (msg.includes('column') && msg.includes('user_id')) {
      const { data, error } = await supabase.from('ingresos').insert([baseRow]).select()
      if (error) throw error
      return data
    }
    throw e
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser()
    return data.user?.id ?? null
  } catch {
    return null
  }
}

export function presetCategories() {
  return [
    { key: 'salario', label: 'Salario' },
    { key: 'regalos', label: 'Regalos' },
    { key: 'pension', label: 'Pensión' },
  ] as const
}
