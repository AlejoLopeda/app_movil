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

      <!-- Toast LOCAL solo para esta vista (errores) -->
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
import { IonPage, IonContent, IonToast, useIonRouter } from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import ReminderForm from '@/components/ReminderForm.vue'
import { useAddReminder } from '@/composables/useAddReminder'
import '@/theme/ExpensePage.css'

const route = useRoute()
const router = useRouter()
const ionRouter = useIonRouter()

const pageTitle = computed(() => route.meta?.title || 'Añadir Recordatorio')

const { loading, saveReminder } = useAddReminder()
const formRef = ref(null)

// ✅ Toast SOLO local (errores)
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

function goToReminders (query = undefined) {
  const q = query || {}
  const url = buildUrl(q)

  // 1) Intento con ionRouter (mejor en app móvil)
  const navigated = ionRouter.navigate(url, 'back', 'replace')
  if (navigated) return

  // 2) Fallback a vue-router
  router.replace({ path: '/recordatorios', query: q }).catch(async () => {
    try {
      await router.push({ path: '/recordatorios', query: q })
    } catch {
      const url = buildUrl(q)
      globalThis.location.href = url
    }
  })
}

/* ===== Guardar recordatorio ===== */
async function handleSubmit (payload) {
  const res = await saveReminder(payload)

  if (res.ok) {
    try {
      // Avisar a la capa de notificaciones/refrescos
      window.dispatchEvent(
      globalThis.dispatchEvent(
        new CustomEvent('reminders:changed', { detail: { action: 'created' } })
      )
    } catch {}

    // Ir a /recordatorios con bandera de creado
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

/* ===== Integración con bottom bar: evento global bottom-accept ===== */
function onBottomAccept () {
  if (loading.value) return
  // sin chequear route.path, como en reportes
  formRef.value?.submit?.()
}

onMounted(() => {
  globalThis.addEventListener('bottom-accept', onBottomAccept)
  globalThis.addEventListener('bottom-back', onBottomBack)
})

onBeforeUnmount(() => {
  globalThis.removeEventListener('bottom-accept', onBottomAccept)
  globalThis.removeEventListener('bottom-back', onBottomBack)
})
</script>

