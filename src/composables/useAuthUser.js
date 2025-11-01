// src/composables/useAuthUser.js
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

const userRef = ref(null)
let inited = false

function ensureInit () {
  if (inited) return
  inited = true

  // Sesión inicial
  supabase.auth.getUser().then(({ data }) => {
    userRef.value = data?.user || null
  })

  // Mantener en memoria sin pedir de nuevo
  supabase.auth.onAuthStateChange((_evt, session) => {
    userRef.value = session?.user || null
  })
}

export function useAuthUser () {
  ensureInit()
  return {
    user: userRef,
    userId: () => userRef.value?.id || '',
    isLoggedIn: () => !!userRef.value,
  }
}
