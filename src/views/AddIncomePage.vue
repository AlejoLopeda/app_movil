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

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
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
import { useAddIncome } from '../composables/useAddIncome'
import IncomeForm from '../components/IncomeForm.vue'
import { getCurrentUserId } from '../lib/incomeService'

const router = useRouter()
const { loading, saveIncome } = useAddIncome()

const toast = ref<{ open: boolean; message: string; color: string }>({ open: false, message: '', color: 'primary' })
function showToast(message: string, color: 'success' | 'danger' | 'primary' = 'primary') {
  toast.value = { open: true, message, color }
}

async function handleSubmit(payload: { monto: number; categoria: string | null; fecha: string; descripcion: string | null }) {
  const res = await saveIncome(payload)
  if (res.ok) {
    showToast('Ingreso guardado', 'success')
    return
  }
  const userId = await getCurrentUserId()
  console.error('[Guardar ingreso][error]', { userId, timestamp: new Date().toISOString(), error: res })
  if (res.reason === 'unauthorized') showToast('No autorizado. Inicia sesión e inténtalo de nuevo', 'danger')
  else if (res.reason === 'rls') showToast('Tu usuario no tiene permiso para guardar en ingresos', 'danger')
  else showToast('No se pudo guardar el ingreso. Intenta de nuevo', 'danger')
}

function goPerfil() {
  router.push('/perfil').catch(() => {})
}

</script>

<style scoped>
.center-title {
  text-align: center;
  margin: 8px 0 16px;
}
</style>

