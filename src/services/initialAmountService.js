import { supabase } from '@/lib/supabaseClient'

export async function fetchInitialAmount() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('profiles').select('initial_amount, initial_set_at').eq('id', user.id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function saveInitialAmount(amount, currency = 'COP') {
  const { data, error } = await supabase.rpc('set_initial_amount', {
    p_amount: amount, p_currency: currency
  })
  if (error) throw new Error(error.message)
  if (!data?.ok) throw new Error(data?.message ?? 'Error al guardar')
  return data
}
