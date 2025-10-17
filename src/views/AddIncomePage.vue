<template>
  <ion-page class="expense-page">
    <!-- ✅ AÑADIDO: usa la misma topbar que el Dashboard -->
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
// ✅ AÑADIDOS: computed, useRoute y AppTopBar
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppTopBar from '@/components/AppTopBar.vue'

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonToast,
  IonButton,
  IonIcon,
} from '@ionic/vue'
import { personCircleOutline } from 'ionicons/icons'
import { useAddIncome } from '@/composables/useAddIncome'
import TransactionForm from '@/components/TransactionForm.vue'
import { getCurrentUserId } from '@/services/incomeService'
import '@/theme/ExpensePage.css'

// ✅ AÑADIDO: título desde meta (o fijo si prefieres)
const route = useRoute()
const pageTitle = computed(() => route.meta?.title || 'INGRESOS')

const { loading, saveIncome } = useAddIncome()
const formRef = ref(null)

const toast = ref({ open: false, message: '', color: 'primary' })
function showToast(message, color = 'primary') {
  toast.value = { open: true, message, color }
}

async function handleSubmit(payload) {
  const res = await saveIncome(payload)
  if (res.ok) {
    showToast('Ingreso guardado', 'success')
    // Resetear el formulario tras guardar correctamente
    formRef.value?.reset?.()
    return
  }
  const userId = await getCurrentUserId()
  console.error('[Guardar ingreso][error]', { userId, timestamp: new Date().toISOString(), error: res })
  if (res.reason === 'unauthorized') showToast('No autorizado. Inicia sesion e intentalo de nuevo', 'danger')
  else if (res.reason === 'rls') showToast('Tu usuario no tiene permiso para guardar en ingresos', 'danger')
  else showToast('No se pudo guardar el ingreso. Intenta de nuevo', 'danger')
}

function goPerfil() {
  showToast('Pantalla de perfil no disponible', 'medium')
}
</script>
