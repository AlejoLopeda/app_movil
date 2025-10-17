<template>
  <ion-page class="expense-page">
    <!-- ✅ usa la misma topbar que el Dashboard -->
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
// ✅ añadidos: router + listeners para navbar
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppTopBar from '@/components/AppTopBar.vue'

import { IonPage, IonContent, IonToast } from '@ionic/vue'
import { useAddIncome } from '@/composables/useAddIncome'
import TransactionForm from '@/components/TransactionForm.vue'
import { getCurrentUserId } from '@/services/incomeService'
import '@/theme/ExpensePage.css'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta?.title || 'INGRESOS')

const { loading, saveIncome } = useAddIncome()

const toast = ref({ open: false, message: '', color: 'primary' })
function showToast(message, color = 'primary') {
  toast.value = { open: true, message, color }
}

// ✅ referencia al formulario unificado
const formRef = ref(null)

// ✅ eventos desde la navbar inferior
function onBottomAccept() {
  // dispara el submit expuesto por el form
  formRef.value?.submit?.()
}
function onBottomBack() {
  // limpia el formulario si el usuario cancela
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

async function handleSubmit(payload) {
  const res = await saveIncome(payload)
  if (res.ok) {
    showToast('Ingreso guardado', 'success')
    // limpia el form para el próximo registro
    formRef.value?.reset?.()
    // y vuelve al dashboard
    setTimeout(() => router.replace('/dashboard'), 450)
    return
  }
  const userId = await getCurrentUserId()
  console.error('[Guardar ingreso][error]', { userId, timestamp: new Date().toISOString(), error: res })
  if (res.reason === 'unauthorized') showToast('No autorizado. Inicia sesión e inténtalo de nuevo', 'danger')
  else if (res.reason === 'rls') showToast('Tu usuario no tiene permiso para guardar en ingresos', 'danger')
  else showToast('No se pudo guardar el ingreso. Intenta de nuevo', 'danger')
}
</script>
