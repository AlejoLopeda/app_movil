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
import AppTopBar from '@/components/AppTopBar.vue'
import { IonPage, IonContent, IonToast } from '@ionic/vue'
import ReminderForm from '@/components/ReminderForm.vue'
import { useAddReminder } from '@/composables/useAddReminder'
import '@/theme/ExpensePage.css'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta?.title || 'Añadir Recordatorio')

const { loading, saveReminder } = useAddReminder()
const formRef = ref(null)

// ✅ Toast SOLO local para esta vista (principalmente errores)
const toast = ref({ open: false, message: '', color: 'primary' })
function showToast (message, color = 'primary') {
  toast.value = { open: true, message, color }
}

/* ===== Helpers de navegación a /recordatorios ===== */
function buildUrl (query) {
  if (!query || Object.keys(query).length === 0) return '/recordatorios'
  const params = new URLSearchParams(query)
  return `/recordatorios?${params.toString()}`
}

// Usamos solo vue-router, con fallback a location.href por si acaso
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
    // Avisar a la lista (si ya está montada) para que recargue
    try {
      window.dispatchEvent(
        new CustomEvent('reminders:changed', { detail: { action: 'created' } })
      )
    } catch {}

    // Navegar a /recordatorios y dejar que ESA vista muestre el toast con ?toast=created
    goToReminders({ toast: 'created' })
    return
  }

  // Si está ocupado, no hacemos nada (ya lo maneja el composable)
  if (res.reason === 'busy') return

  const message =
    res.reason === 'unauthorized'
      ? 'No autorizado. Inicia sesión e inténtalo de nuevo'
      : res.reason === 'rls'
        ? 'Tu usuario no tiene permiso para guardar recordatorios'
        : 'No se pudo crear el recordatorio. Intenta de nuevo'

  showToast(message, 'danger')
}

/* ===== Integración con bottom bar usando SOLO bottom-accept ===== */
// Esto es igual al patrón de ReportePreview con bottom-download
function onBottomAccept () {
  // Pequeña protección: si está cargando o no estamos en esta ruta, ignoramos
  if (loading.value) return
  if (route.path !== '/recordatorios/nuevo') return
  formRef.value?.submit?.()
}

onMounted(() => {
  // Escuchamos bottom-accept como en reportes escuchas bottom-download
  try {
    window.addEventListener('bottom-accept', onBottomAccept)
  } catch {}
})

onBeforeUnmount(() => {
  try {
    window.removeEventListener('bottom-accept', onBottomAccept)
  } catch {}
})
</script>
