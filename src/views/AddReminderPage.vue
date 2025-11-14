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

// ✅ Toast SOLO local para esta vista
const toast = ref({ open: false, message: '', color: 'primary' })

function showToast (message, color = 'primary') {
  toast.value = { open: true, message, color }
}

function buildUrl (query) {
  if (!query || Object.keys(query).length === 0) return '/recordatorios'
  const params = new URLSearchParams(query)
  return `/recordatorios?${params.toString()}`
}

// 🔁 Navegación a la lista SOLO con vue-router
function goToReminders (query = undefined) {
  const q = query || {}
  router.replace({ path: '/recordatorios', query: q }).catch(async () => {
    try {
      await router.push({ path: '/recordatorios', query: q })
    } catch {
      const url = buildUrl(q)
      globalThis.location.href = url
    }
  })
}

async function handleSubmit (payload) {
  const res = await saveReminder(payload)

  if (res.ok) {
    // 1️⃣ Avisar a la lista (para que recargue si escucha este evento)
    try {
      globalThis.dispatchEvent(
        new CustomEvent('reminders:changed', { detail: { action: 'created' } })
      )
    } catch {}

    // 2️⃣ Mostrar toast LOCAL en esta vista
    showToast('Recordatorio creado correctamente', 'success')

    // 3️⃣ Navegar a /recordatorios un pelín después (Android se lleva bien con esto)
    setTimeout(() => {
      goToReminders()
    }, 300)

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

// ==== Eventos bottom bar ====
// ⛔ No aceptar si ya estamos guardando o si ya no estamos en /recordatorios/nuevo
function onBottomAccept () {
  if (route.path !== '/recordatorios/nuevo') return
  if (loading.value) return
  formRef.value?.submit?.()
}

function onBottomBack () {
  if (route.path !== '/recordatorios/nuevo') return
  formRef.value?.reset?.()
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

