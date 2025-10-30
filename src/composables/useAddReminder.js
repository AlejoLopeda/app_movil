import { ref } from 'vue'
import { getCurrentUserId, insertReminder } from '@/services/reminderService'
import { upsertSchedulesForReminder, ensurePermission } from '@/lib/localNotifications'

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

export function useAddReminder() {
  const loading = ref(false)

  const saveReminder = async ({ nombre, frecuencia, fechaFin, hora, comentario, intervaloDias }) => {
    if (loading.value) return BUSY_RESPONSE

    loading.value = true
    try {
      const userId = await getCurrentUserId()
      if (!userId) return { ok: false, reason: 'unauthorized' }

      const res = await insertReminder({
        name: nombre,
        frequency: frecuencia,
        interval_days: frecuencia === 'custom' ? Number(intervaloDias) : null,
        end_date: fechaFin,
        time_at: hora || null,
        comment: comentario || null,
        user_id: userId,
      })

      // Programar notificaciones locales nativas
      try {
        await ensurePermission()
        if (res?.row) await upsertSchedulesForReminder(res.row)
      } catch {}

      // Notify reminder system to refresh immediately (in-app timers)
      try { window.dispatchEvent(new CustomEvent('reminders:changed', { detail: { action: 'created', id: res?.row?.id } })) } catch {}

      return { ok: true }
    } catch (error) {
      return { ok: false, reason: mapErrorReason(error), error }
    } finally {
      loading.value = false
    }
  }

  return { loading, saveReminder }
}