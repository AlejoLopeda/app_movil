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

export async function listActiveReminders() {
  const { data, error } = await supabase
    .from('recordatorios')
    .select('id, user_id, name, frequency, interval_days, end_date, time_at, comment, active, created_at')
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function listReminders() {
  const { data, error } = await supabase
    .from('recordatorios')
    .select('id, user_id, name, frequency, interval_days, end_date, time_at, comment, active, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function deactivateReminder(id) {
  const { error } = await supabase
    .from('recordatorios')
    .update({ active: false })
    .eq('id', id)

  if (error) throw error
  return { ok: true }
}
