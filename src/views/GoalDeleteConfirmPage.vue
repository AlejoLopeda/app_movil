<template>
  <ion-page class="monthly-page">
    <app-top-bar title="METAS" />
    <ion-content class="monthly-content ion-padding" fullscreen>
      <div class="goals-delete">
        <p>¿Estás seguro deseas eliminar la meta?</p>
        <ion-button color="success" expand="block" @click="confirm" :disabled="busy">Sí, eliminar</ion-button>
        <ion-button color="danger" expand="block" fill="outline" @click="cancel" :disabled="busy">No, cancelar</ion-button>
      </div>
      <ion-toast :is-open="toast.open" :message="toast.message" :color="toast.color" duration="2200" @didDismiss="toast.open=false" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonButton, IonToast } from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import { useGoals } from '@/composables/useGoals'
import '@/theme/MonthlyPanel.css'
import '@/theme/goals.css'

const route = useRoute()
const router = useRouter()
const { remove } = useGoals()
const id = Number(route.params.id)
const busy = ref(false)
const toast = ref({ open: false, message: '', color: 'primary' })

function openToast(message, color='primary'){ toast.value = { open: true, message, color } }

async function confirm(){
  busy.value = true
  try {
    await remove(id)
    router.replace('/metas')
  } catch (e) {
    openToast('No se pudo eliminar la meta. Intenta de nuevo.', 'danger')
  } finally { busy.value = false }
}

function cancel(){ router.back() }
</script>
