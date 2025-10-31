<template>
  <ion-page class="expense-page">
    <app-top-bar :title="pageTitle" />

    <ion-content
      class="expense-content ion-padding"
      fullscreen
      style="--padding-top: var(--ion-safe-area-top);"
    >
      <section class="expense-section">
        <TransactionForm
          ref="formRef"
          class="expense-form"
          mode="income"
          :loading="loading"
          :show-submit="false"
          @submit="handleSubmit"
        />
      </section>

      <ion-toast
        class="expense-toast"
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
import { useAddIncome } from '@/composables/useAddIncome'
import { useAuthUser } from '@/composables/useAuthUser'
import TransactionForm from '@/components/TransactionForm.vue'
import '@/theme/ExpensePage.css'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta?.title || 'INGRESOS')

const { loading, saveIncome } = useAddIncome()
const { userId } = useAuthUser()

const toast = ref({ open: false, message: '', color: 'primary' })
function showToast(message, color = 'primary') {
  toast.value = { open: true, message, color }
}

const formRef = ref(null)

// Eventos desde la navbar inferior
function onBottomAccept() { formRef.value?.submit?.() }
function onBottomBack()   { formRef.value?.reset?.() }

onMounted(() => {
  window.addEventListener('bottom-accept', onBottomAccept)
  window.addEventListener('bottom-back', onBottomBack)
})
onBeforeUnmount(() => {
  window.removeEventListener('bottom-accept', onBottomAccept)
  window.removeEventListener('bottom-back', onBottomBack)
})

async function handleSubmit(payload) {
  const res = await saveIncome(payload)
  if (res.ok) {
    showToast('Ingreso guardado', 'success')
    formRef.value?.reset?.()
    setTimeout(() => router.replace('/dashboard'), 450)
    return
  }
  console.error('[Guardar ingreso][error]', {
    userId: userId(),
    timestamp: new Date().toISOString(),
    error: res,
  })
  if (res.reason === 'unauthorized')      showToast('No autorizado. Inicia sesión e inténtalo de nuevo', 'danger')
  else if (res.reason === 'rls')          showToast('Tu usuario no tiene permiso para guardar en ingresos', 'danger')
  else                                    showToast('No se pudo guardar el ingreso. Intenta de nuevo', 'danger')
}
</script>
