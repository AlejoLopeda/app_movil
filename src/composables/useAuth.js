import { ref } from 'vue'
import { useSupabase } from './useSupabase.js'

const isLoading = ref(false)
const authError = ref(null)
const registrationResult = ref(null)

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
      return `No pudimos guardar la cuenta. Detalle: ${detail}`
    }
    return 'No pudimos guardar la cuenta. Revisa las reglas y triggers en Supabase.'
  }

  if (error?.status === 429) {
    return 'Hay mucho trafico en este momento. Intenta nuevamente en unos segundos.'
  }

  return message || 'No pudimos completar el registro. Intenta de nuevo.'
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

  return {
    register,
    isLoading,
    authError,
    registrationResult
  }
}