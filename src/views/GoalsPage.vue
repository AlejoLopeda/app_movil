<template>
  <ion-page class="monthly-page">
    <app-top-bar title="METAS" />
    <ion-content class="monthly-content ion-padding" fullscreen>
      <section class="monthly-section">
        <header class="monthly-header">
          <div>
            <h2 class="monthly-header__title">Panel de Metas</h2>
            <p class="monthly-header__subtitle">Gestiona tu ahorro por meta</p>
          </div>
          <div class="monthly-actions">
            <ion-button @click="goToCreate">
              <ion-icon slot="start" :icon="addOutline" />
              CREAR
            </ion-button>
          </div>
        </header>

        <div v-if="loading" class="monthly-spinner">
          <ion-spinner name="crescent" />
        </div>

        <div v-if="error" class="monthly-error">
          No se pudo cargar la información. Intenta de nuevo.
        </div>

        <p v-if="!loading && !goals.length" class="monthly-empty">
          No tienes metas creadas. Pulsa CREAR para añadir una.
        </p>

        <section v-else class="goals-list">
          <goal-list-item
            v-for="g in goals"
            :key="g.id"
            :goal="g"
            :format="formatCurrency"
            :transactions="transactionsMap.get(g.id) || []"
            @edit="goToEdit"
            @delete="goToDelete"
            @deposit="onDeposit"
            @withdraw="onWithdraw"
            @toggle-history="loadHistory"
          />
        </section>
      </section>

      <ion-toast :is-open="toast.open" :message="toast.message" :color="toast.color" duration="2200" @didDismiss="toast.open=false" />
    </ion-content>
  </ion-page>
  
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonButton, IonSpinner, IonIcon, IonToast } from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import AppTopBar from '@/components/AppTopBar.vue'
import GoalListItem from '@/components/GoalListItem.vue'
import { useGoals } from '@/composables/useGoals'
import '@/theme/MonthlyPanel.css'
import '@/theme/goals.css'

const router = useRouter()
const { loading, error, goals, refresh, deposit, withdraw, fetchTransactions, formatCurrency } = useGoals()
const transactionsMap = ref(new Map())

const toast = ref({ open: false, message: '', color: 'primary' })
function openToast(message, color='primary'){ toast.value = { open: true, message, color } }

onMounted(refresh)

function goToCreate(){ router.push('/metas/nueva') }
function goToEdit(id){ router.push(`/metas/${id}/editar`) }
function goToDelete(id){ router.push(`/metas/${id}/eliminar`) }

async function onDeposit(payload){
  try {
    await deposit({ metaId: payload.id, amount: payload.amount, description: payload.description })
  } catch (e) {
    openToast(e?.message || 'No se pudo abonar', 'danger')
  }
}

async function onWithdraw(payload){
  try {
    await withdraw({ metaId: payload.id, amount: payload.amount, description: payload.description })
  } catch (e) {
    openToast(e?.message || 'No se pudo retirar', 'danger')
  }
}

async function loadHistory(metaId){
  try {
    const rows = await fetchTransactions(metaId)
    const map = new Map(transactionsMap.value)
    map.set(metaId, rows)
    transactionsMap.value = map
  } catch (e) {
    openToast('No se pudo cargar el historial', 'warning')
  }
}
</script>
