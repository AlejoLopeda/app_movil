import { ref } from 'vue'
import { getCurrentUserId, insertExpense } from '@/lib/expenseService'

const BUSY_RESPONSE = Object.freeze({ ok: false, reason: 'busy' })

function mapErrorReason(error) {
  if (!error) return 'unknown'
  const code = error.code || error.status || ''
  const message = (error.message || '').toLowerCase()
  const details = (error.details || '').toLowerCase()

  if (code === '42501' || message.includes('policy') || details.includes('policy')) {
    return 'rls'
  }

  if (
    code === 'PGRST301' ||
    message.includes('jwt') ||
    message.includes('token') ||
    message.includes('auth') ||
    details.includes('jwt')
  ) {
    return 'unauthorized'
  }

  if (message.includes('session') && message.includes('missing')) {
    return 'unauthorized'
  }

  return 'unknown'
}

export function useAddExpense() {
  const loading = ref(false)

  const saveExpense = async ({ monto, categoria, fecha, descripcion }) => {
    if (loading.value) return BUSY_RESPONSE

    loading.value = true
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        return { ok: false, reason: 'unauthorized' }
      }

      await insertExpense({
        amount: Number(monto),
        category_key: categoria || null,
        occurred_on: fecha,
        description: descripcion || null,
        user_id: userId
      })

      return { ok: true }
    } catch (error) {
      return { ok: false, reason: mapErrorReason(error), error }
    } finally {
      loading.value = false
    }
  }

  return { loading, saveExpense }
}
