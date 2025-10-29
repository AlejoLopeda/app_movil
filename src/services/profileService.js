// src/services/profileService.js
import { supabase } from '@/lib/supabaseClient'

/* ======================== Auth / Perfil ======================== */
export async function getAuthUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data?.user || null
}

export async function getProfileName(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()
  // PGRST116 = no rows returned
  if (error && error.code !== 'PGRST116') throw error
  return data?.full_name || ''
}

export async function getProfileExtras(userId) {
  const { data, error } = await supabase
    .from('profile_extras')
    .select('phone, country, birthdate, avatar_url')
    .eq('user_id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function upsertProfileExtras(payload) {
  const { error } = await supabase
    .from('profile_extras')
    .upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
}

/** ✅ Persiste SOLO el avatar_url (cuando subes un nuevo avatar) */
export async function updateAvatarUrl(userId, path) {
  const payload = {
    user_id: userId,
    avatar_url: path,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase
    .from('profile_extras')
    .upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
  return true
}

/* ======================== Password ======================== */
export async function reauthWithPassword(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function refreshSession() {
  const { error } = await supabase.auth.refreshSession()
  if (error) throw error
}

/* ======================== Storage (avatar) ======================== */
export async function createSignedUrl(bucket, path, ttlSeconds) {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .createSignedUrl(path, ttlSeconds)
  if (error) throw error
  return data?.signedUrl || ''
}

export async function uploadAvatar(bucket, path, file) {
  const { error } = await supabase
    .storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  return true
}

/* ======================== Logout ======================== */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
