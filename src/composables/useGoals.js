import { ref, computed } from 'vue'
import {
  listGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  depositToGoal,
  withdrawFromGoal,
  listGoalTransactions,
  formatCOP
} from '@/services/goalsService'

export function useGoals() {
  const loading = ref(false)
  const error = ref(null)
  const goals = ref([])

  const hasGoals = computed(() => goals.value.length > 0)

  const refresh = async () => {
    loading.value = true
    error.value = null
    try {
      goals.value = await listGoals()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  const findById = async (id) => {
    return await getGoalById(id)
  }

  const create = async (payload) => {
    error.value = null
    const res = await createGoal(payload)
    await refresh()
    return res
  }

  const update = async (payload) => {
    error.value = null
    const res = await updateGoal(payload)
    await refresh()
    return res
  }

  const remove = async (id) => {
    error.value = null
    await deleteGoal(id)
    await refresh()
    return { ok: true }
  }

  const deposit = async ({ metaId, amount, description }) => {
    if (!amount || Number(amount) <= 0) {
      throw new Error('El monto debe ser mayor a 0.')
    }
    const tx = await depositToGoal({ metaId, amount, description })
    await refresh()
    return tx
  }

  const withdraw = async ({ metaId, amount, description }) => {
    if (!amount || Number(amount) <= 0) {
      throw new Error('El monto debe ser mayor a 0.')
    }
    const tx = await withdrawFromGoal({ metaId, amount, description })
    await refresh()
    return tx
  }

  const fetchTransactions = async (metaId) => {
    return await listGoalTransactions(metaId)
  }

  const formatCurrency = (n) => formatCOP(n)

  return {
    loading,
    error,
    goals,
    hasGoals,
    refresh,
    findById,
    create,
    update,
    remove,
    deposit,
    withdraw,
    fetchTransactions,
    formatCurrency
  }
}

