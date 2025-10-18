import { ref } from 'vue'
import { listActiveReminders } from '@/services/reminderService'

export function useReminders() {
  const loading = ref(false)
  const error = ref('')
  const items = ref([])

  const load = async () => {
    if (loading.value) return
    loading.value = true
    error.value = ''
    try {
      items.value = await listActiveReminders()
    } catch (e) {
      error.value = 'No se pudieron cargar los recordatorios'
      items.value = []
    } finally {
      loading.value = false
    }
  }

  return { loading, error, items, load }
}

