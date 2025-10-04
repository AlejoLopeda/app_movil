<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>INGRESOS</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goPerfil">
            <ion-icon :icon="personCircleOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h2 class="center-title">Añadir ingreso</h2>
      <IncomeForm :loading="loading" @submit="handleSubmit" />
      <ion-toast :is-open="toast.open" :message="toast.message" :color="toast.color" :duration="2200" @didDismiss="toast.open=false" />
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
import { getCurrentUserId } from '@/lib/incomeService'

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

<style scoped>
.center-title {
  text-align: center;
  margin: 8px 0 16px;
}
</style>







