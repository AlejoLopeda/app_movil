import { supabase } from '@/lib/supabaseClient'
import { insertIncome } from '@/services/incomeService'

function formatDateOnly(d = new Date()) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function fetchInitialAmount() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('profiles').select('initial_amount, initial_set_at').eq('id', user.id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function saveInitialAmount(amount, currency = 'COP') {
  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Ingresa un monto válido')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No se encontró una sesión activa')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('initial_set_at')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error(profileError.message)
  if (profile?.initial_set_at) {
    throw new Error('El monto inicial ya fue registrado')
  }

  let incomeResult
  try {
    incomeResult = await insertIncome({
      amount: numericAmount,
      category_key: 'saldo_inicial',
      occurred_on: formatDateOnly(new Date()),
      description: 'Saldo inicial de la cuenta',
      user_id: user.id
    })
  } catch (insertError) {
    const message = insertError?.message ?? 'No se pudo registrar el monto inicial'
    throw new Error(message)
  }

  if (!incomeResult?.ok) {
    throw incomeResult?.error instanceof Error
      ? incomeResult.error
      : new Error('No se pudo registrar el monto inicial')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      initial_set_at: new Date().toISOString(),
      currency
    })
    .eq('id', user.id)
    .select('initial_amount, initial_set_at')
    .single()

  if (error) throw new Error(error.message)

  return {
    ok: true,
    balance: incomeResult.balance ?? data?.initial_amount ?? numericAmount,
    initial_set_at: data?.initial_set_at ?? new Date().toISOString()
  }
}
