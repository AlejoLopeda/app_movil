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

const loading = ref(false)
const error = ref(null)
const goals = ref([])

const hasGoals = computed(() => goals.value.length > 0)

function emitGoalsChanged() {
    window.dispatchEvent(new CustomEvent('data:goals-changed'))
}

const refresh = async() => {
    loading.value = true
    error.value = null
    try {
        goals.value = await listGoals()
    } catch (e) {
        error.value = e
        throw e
    } finally {
        loading.value = false
    }
}

const findById = async(id) => {
    return await getGoalById(id)
}

const create = async(payload) => {
    error.value = null
    const res = await createGoal(payload)
    await refresh().catch(() => {})
    emitGoalsChanged()
    return res
}

const update = async(payload) => {
    error.value = null
    const res = await updateGoal(payload)
    await refresh().catch(() => {})
    emitGoalsChanged()
    return res
}

const remove = async(id) => {
    error.value = null
    await deleteGoal(id)
    await refresh().catch(() => {})
    emitGoalsChanged()
    return { ok: true }
}

const deposit = async({ metaId, amount, description }) => {
    if (!amount || Number(amount) <= 0) {
        throw new Error('El monto debe ser mayor a 0.')
    }
    // Validación: el total ahorrado no debe superar el objetivo de la meta
    try {
        const goal = await getGoalById(metaId)
        if (goal) {
            const objetivo = Number(goal.objetivo) || 0
            const ahorrado = Number(goal.ahorrado) || 0
            if (ahorrado + Number(amount) > objetivo) {
                throw new Error('El depósito excede el objetivo de la meta')
            }
        }
    } catch (e) {
        // Si getGoalById falló por red, dejamos que el RPC final maneje la validación en backend.
        // Pero si la validación del objetivo detecta excedente, lanzamos el error.
        if (e.message === 'El depósito excede el objetivo de la meta') throw e
            // en caso de otro error, continuamos hacia el RPC
    }

    const tx = await depositToGoal({ metaId, amount, description })
    await refresh().catch(() => {})
    emitGoalsChanged()
    return tx
}

const withdraw = async({ metaId, amount, description }) => {
    if (!amount || Number(amount) <= 0) {
        throw new Error('El monto debe ser mayor a 0.')
    }
    const tx = await withdrawFromGoal({ metaId, amount, description })
    await refresh().catch(() => {})
    emitGoalsChanged()
    return tx
}

const fetchTransactions = async(metaId) => {
    return await listGoalTransactions(metaId)
}

const formatCurrency = (n) => formatCOP(n)

export function useGoals() {
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