<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h2>¡Bienvenido {{ displayName }}!</h2>

      <ion-card v-if="loaded && hasInitial">
        <ion-card-content>
          <p>✅ El monto inicial se ingresó correctamente.</p>
          <p><strong>Monto:</strong> {{ formattedAmount }}</p>
        </ion-card-content>
      </ion-card>

      <ion-card v-else-if="loaded && !hasInitial">
        <ion-card-content>
          <p>⚠️ No has ingresado un monto inicial todavía.</p>
          <ion-button router-link="/monto" expand="block">Ingresar monto</ion-button>
        </ion-card-content>
      </ion-card>

      <ion-button expand="block" color="danger" @click="onLogout">
        Cerrar sesión
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonButton
} from '@ionic/vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { fetchInitialAmount } from '@/services/initialAmountService'

const { user, logout } = useAuth()
const router = useRouter()

const displayName = ref('Usuario')
const amount = ref(null)
const hasInitial = ref(false)
const loaded = ref(false)

onMounted(async () => {
  if (user.value?.user_metadata?.full_name) {
    displayName.value = user.value.user_metadata.full_name
  }

  const d = await fetchInitialAmount().catch(() => null)
  if (d) {
    amount.value = d.initial_amount
    hasInitial.value = Boolean(d.initial_set_at)
  }
  loaded.value = true
})

const formattedAmount = computed(() => {
  if (!amount.value) return ''
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2
  }).format(amount.value)
})

async function onLogout() {
  await logout()
  router.replace('/login')
}
</script>