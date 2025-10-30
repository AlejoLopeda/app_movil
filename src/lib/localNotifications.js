// Lightweight shim for Local Notifications usage in the app.
// - Avoids build-time dependency on @capacitor/local-notifications
// - Provides safe no-ops on web and when the plugin is not installed
// - Keeps a consistent API for the rest of the app

import { Capacitor } from '@capacitor/core'

async function getPlugin() {
  if (!isNativeLN()) return null
  try {
    // Use vite-ignore so dev server doesn't try to prebundle when not installed
    const mod = await import(/* @vite-ignore */ '@capacitor/local-notifications')
    return mod?.LocalNotifications ?? null
  } catch (e) {
    // Not installed or not available; fall back to shims
    return null
  }
}

function toNotiId(id) {
  const n = Number(id)
  if (Number.isInteger(n) && n >= 0) return n
  // Simple stable hash for non-numeric IDs
  const s = String(id)
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h) || 1
}

function parseTimeHHmm(time) {
  if (!time || typeof time !== 'string') return { h: 9, m: 0 }
  const [hh, mm] = time.split(':').map((x) => parseInt(x, 10))
  const h = Number.isFinite(hh) ? hh : 9
  const m = Number.isFinite(mm) ? mm : 0
  return { h, m }
}

export function isNativeLN() {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

export async function ensurePermission() {
  // Native: try Capacitor plugin
  const LN = await getPlugin()
  if (LN) {
    try {
      const status = await LN.checkPermissions()
      const display = status?.display || status?.receive || status?.status
      if (display === 'granted') return { granted: true }
      const req = await LN.requestPermissions()
      const d2 = req?.display || req?.receive || req?.status
      return { granted: d2 === 'granted' }
    } catch {
      // fall through to web
    }
  }

  // Web fallback using the Notifications API
  try {
    if (typeof Notification === 'undefined') return { granted: false }
    const state = Notification.permission
    if (state === 'granted') return { granted: true }
    if (state === 'denied') return { granted: false, canAskAgain: false }
    const res = await Notification.requestPermission().catch(() => 'denied')
    return { granted: res === 'granted', canAskAgain: false }
  } catch {
    return { granted: false }
  }
}

export async function upsertSchedulesForReminder(_reminder) {
  const r = _reminder || {}
  const LN = await getPlugin()
  if (!LN) return

  // Build a repeating schedule when possible
  const { h, m } = parseTimeHHmm(r.time_at)
  const notiId = toNotiId(r.id)
  const title = r.name || 'Recordatorio'
  const body = 'Toca para ver tus recordatorios'

  // Cancel any existing schedule for this reminder id first
  try { await LN.cancel({ notifications: [{ id: notiId }] }) } catch {}

  const frequency = (r.frequency || 'daily').toLowerCase()
  const createdAt = r.created_at ? new Date(r.created_at) : new Date()

  const schedule = { repeats: true }
  if (frequency === 'daily') {
    Object.assign(schedule, { every: 'day', on: { hour: h, minute: m } })
  } else if (frequency === 'weekly') {
    const jsDay = createdAt.getDay() // 0-6, Sun=0
    const weekday = ((jsDay + 1) % 7) + 1 // 1-7, Sun=1
    Object.assign(schedule, { every: 'week', on: { weekday, hour: h, minute: m } })
  } else if (frequency === 'monthly') {
    const day = createdAt.getDate()
    Object.assign(schedule, { every: 'month', on: { day, hour: h, minute: m } })
  } else if (frequency === 'custom') {
    // Not natively supported by plugin as every N days; skip scheduling to avoid wrong cadence
    console.warn('[localNotifications] Custom interval not supported natively; skipping schedule')
    return
  } else {
    Object.assign(schedule, { every: 'day', on: { hour: h, minute: m } })
  }

  try {
    await LN.schedule({
      notifications: [
        {
          id: notiId,
          title,
          body,
          schedule,
          smallIcon: 'ic_stat_icon',
        },
      ],
      allowWhileIdle: true,
    })
  } catch (e) {
    console.warn('[localNotifications] schedule failed', e)
  }
}

export async function cancelSchedulesForReminder(_reminderId) {
  const LN = await getPlugin()
  if (!LN) return
  const id = toNotiId(_reminderId)
  try {
    await LN.cancel({ notifications: [{ id }] })
  } catch (e) {
    console.warn('[localNotifications] cancel failed', e)
  }
}
