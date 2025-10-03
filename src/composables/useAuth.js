import { computed, ref } from 'vue'
import { useSupabase } from './useSupabase.js'

const isLoading = ref(false)
const authError = ref(null)
const registrationResult = ref(null)
const session = ref(null)
const user = ref(null)
let isInitialized = false

const mapSignUpError = (error) => {
  if (!error) {
    return null
  }

  const message = error?.message ?? ''
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('already registered') || error?.code === '23505') {
    return 'Este correo ya esta registrado. Por favor inicia sesion.'
  }

  if (normalizedMessage.includes('password should be at least 6 characters')) {
    return 'La contrasena debe tener al menos 6 caracteres.'
  }

  if (normalizedMessage.includes('password should contain at least one character of each')) {
    return 'La contrasena debe incluir al menos una minuscula, una mayuscula, un numero y un simbolo.'
  }

  if (message === 'Database error saving new user') {
    const detail = error?.details ?? error?.hint
    if (detail) {
      return 'No pudimos guardar la cuenta. Detalle: ' + detail
    }
    return 'No pudimos guardar la cuenta. Revisa las reglas y triggers en Supabase.'
  }

  if (error?.status === 429) {
    return 'Hay mucho trafico en este momento. Intenta nuevamente en unos segundos.'
  }

  return message || 'No pudimos completar el registro. Intenta de nuevo.'
}

const mapSignInError = (error) => {
  if (!error) {
    return null
  }

  const message = error?.message ?? ''
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Contraseña o correo invalido. Verifica tu correo y contrasena.'
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Debes confirmar tu correo antes de ingresar.'
  }

  if (normalizedMessage.includes('invalid email')) {
    return 'Ingresa un correo valido.'
  }

  if (error?.status === 400) {
    return 'Contraseña o correo invalido. Intenta nuevamente.'
  }

  if (error?.status === 429) {
    return 'Hay mucho trafico en este momento. Intenta nuevamente en unos segundos.'
  }

  return message || 'No pudimos iniciar sesion. Intenta de nuevo.'
}

async function ensureAuthInitialized(supabase) {
  if (isInitialized) {
    return session.value
  }

  isInitialized = true

  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('[useAuth] getSession error', error)
    }
    session.value = data?.session ?? null
    user.value = data?.session?.user ?? null
  } catch (error) {
    console.error('[useAuth] ensureAuthInitialized unexpected error', error)
  }

  supabase.auth.onAuthStateChange((event, currentSession) => {
    session.value = currentSession
    user.value = currentSession?.user ?? null

    if (event === 'SIGNED_OUT') {
      registrationResult.value = null
    }
  })

  return session.value
}

export function useAuth() {
  const { supabase } = useSupabase()

  const register = async ({ name, email, password, passwordConfirmation }) => {
    authError.value = null
    registrationResult.value = null

    const trimmedName = name?.trim() ?? ''
    const trimmedEmail = email?.trim().toLowerCase() ?? ''

    if (!trimmedName || !trimmedEmail || !password || !passwordConfirmation) {
      const message = 'Todos los campos son obligatorios.'
      authError.value = message
      return { error: message }
    }

    if (password.length < 6) {
      const message = 'La contrasena debe tener al menos 6 caracteres.'
      authError.value = message
      return { error: message }
    }

    if (password !== passwordConfirmation) {
      const message = 'Las contrasenas no coinciden.'
      authError.value = message
      return { error: message }
    }

    await ensureAuthInitialized(supabase)

    isLoading.value = true

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName
          }
        }
      })

      if (error) {
        console.error('[useAuth] supabase.auth.signUp error', error)
        const formatted = mapSignUpError(error)
        authError.value = formatted
        return { error: formatted }
      }

      registrationResult.value = data
      return { data }
    } catch (error) {
      console.error('[useAuth] register unexpected error', error)
      const message = 'No pudimos completar el registro. Intenta de nuevo.'
      authError.value = message
      return { error: message }
    } finally {
      isLoading.value = false
    }
  }

  const login = async ({ email, password }) => {
    authError.value = null

    const trimmedEmail = email?.trim().toLowerCase() ?? ''

    if (!trimmedEmail || !password) {
      const message = 'Correo y contrasena son obligatorios.'
      authError.value = message
      return { error: message }
    }

    await ensureAuthInitialized(supabase)

    isLoading.value = true

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password
      })

      if (error) {
        console.error('[useAuth] supabase.auth.signInWithPassword error', error)
        const formatted = mapSignInError(error)
        authError.value = formatted
        return { error: formatted }
      }

      session.value = data?.session ?? session.value
      user.value = data?.session?.user ?? data?.user ?? user.value
      return { data }
    } catch (error) {
      console.error('[useAuth] login unexpected error', error)
      const message = 'No pudimos iniciar sesion. Intenta de nuevo.'
      authError.value = message
      return { error: message }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    authError.value = null

    try {
      await supabase.auth.signOut()
      session.value = null
      user.value = null
    } catch (error) {
      console.error('[useAuth] logout error', error)
      const message = 'No pudimos cerrar sesion. Intenta de nuevo.'
      authError.value = message
      return { error: message }
    }

    return { data: true }
  }

  const restoreSession = async () => {
    await ensureAuthInitialized(supabase)
    return { session: session.value, user: user.value }
  }

  const isAuthenticated = computed(() => Boolean(user.value))

  return {
    register,
    login,
    logout,
    restoreSession,
    isAuthenticated,
    user,
    session,
    isLoading,
    authError,
    registrationResult
  }
}
