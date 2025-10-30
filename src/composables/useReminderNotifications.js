import { onMounted, onUnmounted } from 'vue'
import { listActiveReminders } from '@/services/reminderService'
import { supabase } from '@/lib/supabaseClient'
import { showBanner } from '@/stores/notify'
import { isNativeLN, ensurePermission, upsertSchedulesForReminder } from '@/lib/localNotifications'

// Internal singleton state to avoid multiple intervals
let intervalId = null
let refreshId = null
let lastFiredMap = new Map() // id -> lastFiredKey (e.g. '2025-10-29T08:30')
let cache = {
  reminders: [],
  userId: null,
}
let authSubscribed = false

function parseTimeHHmm(time) {
  if (!time || typeof time !== 'string') return { h: 9, m: 0 }
  const [hh, mm] = time.split(':').map((x) => parseInt(x, 10))
  const h = Number.isFinite(hh) ? hh : 9
  const m = Number.isFinite(mm) ? mm : 0
  return { h, m }
}

function ymd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function ymdhm(date) {
  const base = ymd(date)
  const HH = String(date.getHours()).padStart(2, '0')
  const MM = String(date.getMinutes()).padStart(2, '0')
  return `${base}T${HH}:${MM}`
}

function combineDateAndTime(date, timeAt) {
  const { h, m } = parseTimeHHmm(timeAt)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0)
  return d
}

function diffDays(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.floor((utcB - utcA) / msPerDay)
}

function isAfterEndDate(now, endDate) {
  if (!endDate) return false
  try {
    const d = new Date(endDate)
    if (isNaN(d.getTime())) return false
    // If today is after end_date (ignoring time), stop
    return diffDays(d, now) < 0
  } catch {
    return false
  }
}

function shouldTrigger(now, reminder) {
  // Basic guards
  if (!reminder?.active) return false
  if (isAfterEndDate(now, reminder.end_date)) return false

  const createdAt = reminder.created_at ? new Date(reminder.created_at) : now
  const baseTime = parseTimeHHmm(reminder.time_at)

  const minuteNowKey = ymdhm(now)
  const lastKey = lastFiredMap.get(reminder.id)
  if (lastKey === minuteNowKey) return false // already fired in this minute

  // Build todayâ€™s scheduled time
  const todayAt = combineDateAndTime(now, reminder.time_at)
  const matchesTimeThisMinute = ymdhm(todayAt) === minuteNowKey
  if (!matchesTimeThisMinute) return false

  const frequency = reminder.frequency || 'daily'

  if (frequency === 'daily') {
    return true
  }

  if (frequency === 'weekly') {
    // Trigger every 7 days counting from created_at at the given time
    const baseAt = combineDateAndTime(createdAt, reminder.time_at)
    const d = diffDays(baseAt, now)
    return d >= 0 && d % 7 === 0
  }

  if (frequency === 'monthly') {
    // Trigger same day-of-month as created_at
    const baseDay = createdAt.getDate()
    const todayDay = now.getDate()
    return baseDay === todayDay
  }

  if (frequency === 'custom') {
    const N = Number(reminder.interval_days) || 0
    if (N <= 0) return false
    const baseAt = combineDateAndTime(createdAt, reminder.time_at)
    const d = diffDays(baseAt, now)
    return d >= 0 && d % N === 0
  }

  // Default: behave like daily
  return true
}

function frequencyLabel(r) {
  const f = (r?.frequency || '').toLowerCase()
  if (f === 'daily') return 'Diario'
  if (f === 'weekly') return 'Semanal'
  if (f === 'monthly') return 'Mensual'
  if (f === 'custom') {
    const n = Number(r?.interval_days) || 0
    return n > 0 ? `Cada ${n} dias` : 'Personalizado'
  }
  return 'Diario'
}

function metaText(r) {
  const parts = []
  parts.push(frequencyLabel(r))
  if (r?.time_at) parts.push('a las ' + r.time_at)
  if (r?.end_date) parts.push('hasta ' + String(r.end_date).slice(0,10))
  return parts.join(' - ')
}async function refreshReminders() {
  try {
    await ensureUser()
    const items = await listActiveReminders()
    if (Array.isArray(items)) {
      const userId = cache.userId
      cache.reminders = userId ? items.filter((x) => x.user_id === userId) : []
    }
  } catch (err) {
    // Silently ignore refresh errors (no toast here)
    console.error('[useReminderNotifications] refreshReminders error:', err)
  }
}

async function ensureUser() {
  // Subscribe once to auth state changes to keep cache in sync without polling
  if (!authSubscribed) {
    try {
      supabase.auth.onAuthStateChange((_event, session) => {
        cache.userId = session?.user?.id || null
      })
      authSubscribed = true
    } catch {}
  }
  if (cache.userId) return cache.userId
  // Read from session (memory/storage). Avoids hitting /auth/v1/user repeatedly.
  try {
    const { data } = await supabase.auth.getSession()
    cache.userId = data?.session?.user?.id || null
  } catch {
    cache.userId = null
  }
  return cache.userId
}

function tick() {
  const now = new Date()
  for (const r of cache.reminders) {
    if (shouldTrigger(now, r)) {
      lastFiredMap.set(r.id, ymdhm(now))
      const name = r.name || 'Recordatorio'
      // Show personalized banner (prefer banner over toast for visibility across screens)
      showBanner({ title: `Recordatorio: ${name}`, body: metaText(r), color: 'tertiary' })
    }
  }
}

export function useReminderNotifications() {
  onMounted(async () => {
    if (intervalId) return // already running
    await ensureUser()
    await refreshReminders()

    // Native sync: programar en el sistema las notificaciones de recordatorios activos existentes
    try {
      if (isNativeLN()) {
        const perm = await ensurePermission()
        if (perm.granted) {
          for (const r of cache.reminders) {
            try { await upsertSchedulesForReminder(r) } catch {}
          }
        }
      }
    } catch {}

    // Run an immediate tick so near-term reminders fire without waiting
    try { tick() } catch {}

    // Check every 30 seconds to catch the minute the reminder hits
    intervalId = setInterval(tick, 30 * 1000)

    // Refresh active reminders list every 60 seconds (was 5 minutes)
    refreshId = setInterval(refreshReminders, 60 * 1000)

    // Listen for app-level events to refresh immediately after CRUD actions
    const onChanged = () => { refreshReminders().then(() => { try { tick() } catch {} }) }
    window.addEventListener('reminders:changed', onChanged)

    // When the tab regains focus or becomes visible, refresh + tick
    const onFocus = () => { refreshReminders().then(() => { try { tick() } catch {} }) }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus()
    })

    // Store cleanup callbacks on window to remove on unmount
    window.__remindersCleanup = () => {
      window.removeEventListener('reminders:changed', onChanged)
      window.removeEventListener('focus', onFocus)
    }
  })

  onUnmounted(() => {
    // Keep running globally (App.vue), but if unmounted, clear just in case
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    if (refreshId) {
      clearInterval(refreshId)
      refreshId = null
    }
    lastFiredMap = new Map()
    try { window.__remindersCleanup?.(); delete window.__remindersCleanup } catch {}
  })
}
