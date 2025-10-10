<template>
    <ion-page class="income-page">
    <ion-header class="income-header" translucent>
      <ion-toolbar class="income-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="income-menu" />
        </ion-buttons>
        <ion-title class="income-toolbar__title">Ingresos</ion-title>
        <ion-buttons slot="end">
          <ion-button class="income-profile" @click="goPerfil">
            <ion-icon :icon="personCircleOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="income-content ion-padding" fullscreen>
      <section class="income-section">
        <header class="income-hero">
          <span class="income-badge">Nuevo registro</span>
          <h2 class="income-heading">Añadir ingreso</h2>
          <p class="income-copy">Registra los ingresos que recibes para mantener tu control financiero al día.</p>
        </header>

        <IncomeForm class="income-form" :loading="loading" @submit="handleSubmit" />
      </section>

      <ion-toast
        class="income-toast"
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
import { ref } from 'vue'
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
import IncomeForm from '@/components/IncomeForm.vue'
import { getCurrentUserId } from '@/services/incomeService'
import '@/theme/IncomePage.css'

const { loading, saveIncome } = useAddIncome()

const toast = ref({ open: false, message: '', color: 'primary' })
function showToast(message, color = 'primary') {
  toast.value = { open: true, message, color }
}

async function handleSubmit(payload) {
  const res = await saveIncome(payload)
  if (res.ok) {
    showToast('Ingreso guardado', 'success')
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
