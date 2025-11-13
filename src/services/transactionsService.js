// src/services/transactionsService.js
// Totales basados en tu esquema real: tablas "ingresos" y "gastos"
// Campos: monto (number), fecha (YYYY-MM-DD), user_id (uuid)

import { supabase } from '@/lib/supabaseClient'
import { useAuthUser } from '@/composables/useAuthUser'

// Mapeo de tus tablas y columnas
const TABLE_CONFIG = {
  income:  { table: 'ingresos', amountField: 'monto',  dateField: 'fecha' },
  expense: { table: 'gastos',   amountField: 'monto',  dateField: 'fecha' },
}

/** Obtiene el userId priorizando el composable (memoria) y con fallback a Supabase. */
async function getCurrentUserId () {
  try {
    // 1) Intenta desde memoria (composable cacheado por onAuthStateChange)
    const { userId } = useAuthUser()
    const idFromMem = userId && userId()
    if (idFromMem) return idFromMem

    // 2) Fallback único a Supabase si por alguna razón aún no está en memoria
    const { data } = await supabase.auth.getUser()
    return data?.user?.id || null
  } catch {
    return null
  }
}

/**
 * Suma por tipo ('income' | 'expense') para un usuario en rango [from, to].
 * from / to: strings "YYYY-MM-DD" (se consultan inclusivos).
 */
async function sumByType ({ from, to, type, userId }) {
  const cfg = TABLE_CONFIG[type]
  if (!cfg) return 0

  const uid = userId || await getCurrentUserId()
  if (!uid) return 0

  const { table, amountField, dateField } = cfg

  // Consulta inclusiva por fecha y usuario
  let query = supabase
    .from(table)
    .select(`${amountField}, ${dateField}`)
    .gte(dateField, from)
    .lte(dateField, to)
    .eq('user_id', uid)

  const { data, error } = await query

  if (error) {
    console.error(`sumByType ${type} error`, error)
    return 0
  }

  return (data || []).reduce((acc, row) => {
    const val = Number(row?.[amountField]) || 0
    return acc + val
  }, 0)
}

/**
 * Devuelve { incomes, expenses } para un rango [from, to] (INCLUSIVO),
 * filtrado por el usuario autenticado. Puedes pasar userId opcionalmente.
 */
export async function getTotals ({ from, to, userId }) {
  const uid = userId || await getCurrentUserId()
  if (!uid) return { incomes: 0, expenses: 0 }

  const [incomes, expenses] = await Promise.all([
    sumByType({ from, to, type: 'income',  userId: uid }),
    sumByType({ from, to, type: 'expense', userId: uid }),
  ])

  return { incomes, expenses }
}
