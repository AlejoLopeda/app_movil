<template>
  <ion-page class="expense-page">
    <app-top-bar :title="pageTitle" />

    <ion-content
      class="expense-content ion-padding"
      fullscreen
      style="--padding-top: var(--ion-safe-area-top);"
    >
      <section class="expense-section">
        <ReminderForm
          ref="formRef"
          class="expense-form"
          :loading="loading"
          :show-submit="false"
          @submit="handleSubmit"
        />
      </section>

      <!-- Toast local solo para errores -->
      <ion-toast
        :is-open="toast.open"
        :message="toast.message"
        :color="toast.color"
        :duration="2200"
        @didDismiss="toast.open=false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppTopBar from '@/components/AppTopBar.vue'
import { IonPage, IonContent, IonToast } from '@ionic/vue'
import ReminderForm from '@/components/ReminderForm.vue'
import { useAddReminder } from '@/composables/useAddReminder'
import { useBottomBar } from '@/composables/useBottomBar'
import '@/theme/ExpensePage.css'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta?.title || 'Añadir Recordatorio')

const { loading, saveReminder } = useAddReminder()
const formRef = ref(null)

/* ✅ Toast SOLO local para errores en esta vista */
const toast = ref({ open: false, message: '', color: 'primary' })
function showToast (message, color = 'primary') {
  toast.value = { open: true, message, color }
}

/* ===== Navegación a /recordatorios ===== */
function buildUrl (query) {
  if (!query || Object.keys(query).length === 0) return '/recordatorios'
  const params = new URLSearchParams(query)
  return `/recordatorios?${params.toString()}`
}

// Solo vue-router, con fallback a location.href si algo raro pasa
function goToReminders (query = undefined) {
  const q = query || {}
  router.replace({ path: '/recordatorios', query: q }).catch(async () => {
    try {
      await router.push({ path: '/recordatorios', query: q })
    } catch {
      const url = buildUrl(q)
      window.location.href = url
    }
  })
}

/* ===== Guardar recordatorio ===== */
async function handleSubmit (payload) {
  const res = await saveReminder(payload)

  if (res.ok) {
    // Avisar a la lista para que recargue
    try {
      window.dispatchEvent(
        new CustomEvent('reminders:changed', { detail: { action: 'created' } })
      )
    } catch {}

    // Redirigir y dejar que /recordatorios muestre su propio toast (via ?toast=created)
    goToReminders({ toast: 'created' })
    return
  }

  if (res.reason === 'busy') return

  const message =
    res.reason === 'unauthorized'
      ? 'No autorizado. Inicia sesión e inténtalo de nuevo'
      : res.reason === 'rls'
        ? 'Tu usuario no tiene permiso para guardar recordatorios'
        : 'No se pudo crear el recordatorio. Intenta de nuevo'

  showToast(message, 'danger')
}

/* ===== Integración con la bottom bar SIN eventos globales ===== */
const { setAcceptHandler, setBackHandler } = useBottomBar()

function onBottomAccept () {
  // Si no estamos en esta ruta, ignorar (por seguridad)
  if (route.path !== '/recordatorios/nuevo') return
  if (loading.value) return
  formRef.value?.submit?.()
}

function onBottomBack () {
  // Volver a la lista de recordatorios
  goToReminders()
}

onMounted(() => {
  // Registramos handlers específicos para esta vista
  setAcceptHandler(onBottomAccept)
  setBackHandler(onBottomBack)
})

onBeforeUnmount(() => {
  // Limpiamos para no afectar otras pantallas
  setAcceptHandler(null)
  setBackHandler(null)
})
</script>
