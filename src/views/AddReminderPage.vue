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
import { showToast as showGlobalToast } from '@/stores/notify'
import '@/theme/ExpensePage.css'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta?.title || 'Añadir Recordatorio')

const { loading, saveReminder } = useAddReminder()
const formRef = ref(null)
const toast = ref({ open: false, message: '', color: 'primary' })

function buildUrl (query) {
  if (!query || Object.keys(query).length === 0) return '/recordatorios'
  const params = new URLSearchParams(query)
  return `/recordatorios?${params.toString()}`
}

// 🔁 Navegación a la lista SOLO con vue-router (sin useIonRouter)
async function goToReminders (query = undefined) {
  const q = query || {}
  try {
    await router.replace({ path: '/recordatorios', query: q })
  } catch {
    try {
      await router.push({ path: '/recordatorios', query: q })
    } catch {
      const url = buildUrl(q)
      window.location.href = url
    }
  }
}

async function handleSubmit (payload) {
  const res = await saveReminder(payload)

  if (res.ok) {
    // Toast global + query para que la lista muestre su propio toast
    showGlobalToast('Recordatorio creado', 'success', 'bottom')
    await goToReminders({ toast: 'created' })
    return
  }

  if (res.reason === 'busy') return

  const message =
    res.reason === 'unauthorized'
      ? 'No autorizado. Inicia sesión e inténtalo de nuevo'
      : res.reason === 'rls'
        ? 'Tu usuario no tiene permiso para guardar recordatorios'
        : 'No se pudo crear el recordatorio. Intenta de nuevo'

  showGlobalToast(message, 'danger', 'bottom')
}

// ==== Eventos bottom bar ====
function onBottomAccept () {
  formRef.value?.submit?.()
}
function onBottomBack () {
  formRef.value?.reset?.()
}

onMounted(() => {
  window.addEventListener('bottom-accept', onBottomAccept)
  window.addEventListener('bottom-back', onBottomBack)
})
onBeforeUnmount(() => {
  window.removeEventListener('bottom-accept', onBottomAccept)
  window.removeEventListener('bottom-back', onBottomBack)
})
</script>
