import { supabase } from '@/lib/supabaseClient'
export { getCurrentUserId } from '@/services/incomeService'

export async function insertReminder(row) {
  const payload = {
    user_id: row.user_id,
    name: row.name,
    frequency: row.frequency, // 'daily' | 'weekly' | 'monthly' | 'custom'
    interval_days: row.interval_days ?? null, // only for custom
    end_date: row.end_date,
    time_at: row.time_at ?? null,
    comment: row.comment ?? null,
    active: true,
  }

  const { error } = await supabase
    .from('recordatorios')
    .insert(payload)

  if (error) throw error
  return { ok: true }
}

