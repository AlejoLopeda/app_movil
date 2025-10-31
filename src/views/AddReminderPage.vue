<template>
  <ion-page class="expense-page">
    <app-top-bar :title="pageTitle" />

    <ion-content class="expense-content ion-padding" fullscreen style="--padding-top: var(--ion-safe-area-top);">
      <section class="expense-section">
        <ReminderForm ref="formRef" class="expense-form" :loading="loading" :show-submit="false" @submit="handleSubmit" />
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

const toast = ref({ open: false, message: '', color: 'primary' })
function showToast(message, color = 'primary') {
  toast.value = { open: true, message, color }
}

async function handleSubmit(payload) {
  const res = await saveReminder(payload)
  if (res.ok) {
    // Redirigir directamente al panel de recordatorios
    router.replace({ name: 'Recordatorios' })
    return
  }
  if (res.reason === 'unauthorized') showToast('No autorizado. Inicia sesión e inténtalo de nuevo', 'danger')
  else if (res.reason === 'rls') showToast('Tu usuario no tiene permiso para guardar recordatorios', 'danger')
  else showToast('No se pudo crear el recordatorio. Intenta de nuevo', 'danger')
}

// Bottom bar events (special mode): back and accept
function onBottomAccept() {
  formRef.value?.submit?.()
}
function onBottomBack() {
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
