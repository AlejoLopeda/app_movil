// Lightweight shim for Local Notifications usage in the app.
// - Avoids build-time dependency on @capacitor/local-notifications
// - Provides safe no-ops on web and when the plugin is not installed
// - Keeps a consistent API for the rest of the app

import { Capacitor } from '@capacitor/core'

// Dynamic import to avoid bundling in web
async function getPlugin() {
  if (!isNativeLN()) return null
  try {
    const mod = await import(/* @vite-ignore */ '@capacitor/local-notifications')
    return mod?.LocalNotifications ?? null
  } catch {
    return null
  }
}

// Ensure default Android channel exists (safe no-op on iOS/web)
export async function ensureDefaultChannel() {
  const LN = await getPlugin(); if (!LN) return
  try {
    // Id must be stable; name is user-visible in system settings
    await LN.createChannel({
      id: 'reminders',
      name: 'Recordatorios',
      description: 'Recordatorios programados',
      importance: 4, // IMPORTANCE_HIGH
      visibility: 1, // VISIBILITY_PUBLIC
      sound: undefined,
      lights: true,
      vibration: true,
    })
  } catch {}
}

// Simple immediate test: schedule a notification for a few seconds ahead
export async function debugTestNotification(delayMs = 3000) {
  const LN = await getPlugin(); if (!LN) return { ok: false, reason: 'no-plugin' }
  try {
    const perm = await ensurePermission()
    if (!perm.granted) return { ok: false, reason: 'no-permission' }
  } catch {}
  try { await ensureDefaultChannel() } catch {}
  const when = new Date(Date.now() + Math.max(1000, delayMs))
  const id = toNotiId('debug:' + when.toISOString())
  try {
    await LN.schedule({ notifications: [{ id, title: 'Prueba de notificaciones', body: 'Si ves esto, la integración local funciona', channelId: 'reminders', schedule: { at: when } }] })
    return { ok: true, id, when }
  } catch (e) {
    return { ok: false, reason: 'schedule-failed', error: e }
  }
}

export async function listPendingNotifications() {
  const LN = await getPlugin(); if (!LN) return []
  try { const res = await LN.getPending(); return res?.notifications || [] } catch { return [] }
}

function toNotiId(s) {
  const str = String(s)
  let h = 0
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0 }
  return Math.abs(h) || 1
}

function parseTime(time) {
  const [hh, mm] = String(time || '09:00').split(':').map(v => parseInt(v, 10))
  return { h: Number.isFinite(hh) ? hh : 9, m: Number.isFinite(mm) ? mm : 0 }
}

function atDate(base, time) {
  const { h, m } = parseTime(time)
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m, 0, 0)
}

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
function lastDayOfMonth(y,m){ return new Date(y, m+1, 0).getDate() }

export function isNativeLN() {
  try { return Capacitor.isNativePlatform() } catch { return false }
}

export async function ensurePermission() {
  const LN = await getPlugin(); if (!LN) return { granted: false }
  try {
    const s = await LN.checkPermissions()
    if ((s?.display || s?.receive || s?.status) === 'granted') return { granted: true }
    const r = await LN.requestPermissions()
    return { granted: (r?.display || r?.receive || r?.status) === 'granted' }
  } catch { return { granted: false } }
}

export async function checkPermission() {
  const LN = await getPlugin(); if (!LN) return { granted: false }
  try {
    const s = await LN.checkPermissions()
    return { granted: (s?.display || s?.receive || s?.status) === 'granted' }
  } catch { return { granted: false } }
}

function buildOccurrences(rem) {
  const now = new Date()
  const created = rem.created_at ? new Date(rem.created_at) : now
  const end = rem.end_date ? atDate(new Date(rem.end_date), rem.time_at) : addDays(now, 90)
  const occ = []
  const push = d => { if (d.getTime() > now.getTime() + 5e3 && d <= end) occ.push(d) }
  const freq = (rem.frequency || 'daily').toLowerCase()
  const time = rem.time_at

  if (freq === 'daily') {
    let d = now
    for (let i=0;i<120;i++){ push(atDate(d, time)); d = addDays(d,1) }
    return occ
  }
  if (freq === 'weekly') {
    let d = created
    while (atDate(d, time) < now) d = addDays(d,7)
    for (let i=0;i<26;i++){ push(atDate(d,time)); d = addDays(d,7) }
    return occ
  }
  if (freq === 'monthly') {
    const baseDay = created.getDate()
    let y = now.getFullYear(), m = now.getMonth()
    for (let i=0;i<12;i++){
      const day = Math.min(baseDay, lastDayOfMonth(y,m))
      push(new Date(y, m, day, parseTime(time).h, parseTime(time).m, 0, 0))
      m++; if (m>11){ m=0; y++ }
    }
    return occ
  }
  // custom
  const N = Number(rem.interval_days) || 0
  if (N>0){
    let d = created
    while (atDate(d, time) < now) d = addDays(d, N)
    for (let i=0;i<60;i++){ push(atDate(d,time)); d = addDays(d,N) }
  }
  return occ
}

export async function upsertSchedulesForReminder(rem) {
  const LN = await getPlugin(); if (!LN) return
  try { await cancelSchedulesForReminder(rem.id) } catch {}
  const occ = buildOccurrences(rem)
  if (!occ.length) return
  const title = `Recordatorio: ${rem.name || 'Recordatorio'}`
  const body = 'Toca para ver tus recordatorios'
  // Make sure channel exists on Android so notifications actually show
  try { await ensureDefaultChannel() } catch {}
  const notifications = occ.slice(0, 60).map(d => ({
    id: toNotiId(rem.id + ':' + d.toISOString().slice(0,16)),
    title,
    body,
    channelId: 'reminders',
    schedule: { at: d },
  }))
  try { await LN.schedule({ notifications }) } catch {}
}

export async function cancelSchedulesForReminder(reminderId) {
  const LN = await getPlugin(); if (!LN) return
  try { await LN.cancel({ notifications: [{ id: toNotiId(String(reminderId)) }] }) } catch {}
}
