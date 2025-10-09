<template>
  <ion-page>
    <!-- Navbar superior fija, con menú + título + usuario -->
    <app-top-bar
      :title="pageTitle"
      @user="onUser"
      :full-name="displayName"
      :logout-fn="safeLogout"     
      @logout="onLogout"          
      @report="generateReport"
      @edit="goEditProfile"
    />

    <ion-content class="ion-padding" style="--padding-top: var(--ion-safe-area-top);">
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
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  IonPage, IonContent, IonCard, IonCardContent, IonButton
} from '@ionic/vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { fetchInitialAmount } from '@/services/initialAmountService'
import AppTopBar from '@/components/AppTopBar.vue'

const { user, logout } = useAuth()
const router = useRouter()
const route = useRoute()

// Título dinámico con fallback "Inicio"
const pageTitle = computed(() => route.meta?.title || 'Inicio')

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

// 👇 Función pasada a la TopBar con manejo de error
async function safeLogout () {
  try {
    await logout()
    await nextTick()
    router.replace('/login')
  } catch (e) {
    // avisa a la TopBar para mostrar el toast
    window.dispatchEvent(new CustomEvent('logout-failed'))
    // NO navegues; el usuario permanece en la app
  }
}

// (opcional) handler legacy si alguien sigue emitiendo 'logout'
async function onLogout() {
  await safeLogout()
}

function onUser() {}
function generateReport() { console.log('Generar reporte...') }
function goEditProfile() { console.log('Editar perfil...') }
</script>
