import { ref } from 'vue'
import { addIncome, getCurrentUserId, presetCategories, type NewIncome } from '../lib/incomeService'

export function useAddIncome() {
  const loading = ref(false)
  const categories = presetCategories()

  async function saveIncome(payload: NewIncome) {
    loading.value = true
    try {
      const uid = await getCurrentUserId()
      if (!uid) {
        return { ok: false as const, reason: 'unauthorized' as const }
      }
      await addIncome(payload)
      return { ok: true as const }
    } catch (e: any) {
      const msg = String(e?.message ?? '')
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        return { ok: false as const, reason: 'unauthorized' as const, error: e }
      }
      if (msg.includes('row-level security')) {
        return { ok: false as const, reason: 'rls' as const, error: e }
      }
      return { ok: false as const, reason: 'unknown' as const, error: e }
    } finally {
      loading.value = false
    }
  }

  return { loading, saveIncome, categories }
}

