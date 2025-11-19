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
          <!-- Acción CREAR movida al bottom bar; se elimina el botón superior -->
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
            :collapse-key="collapseKey"
            @edit="goToEdit"
            @delete="goToDelete"
            @deposit="onDeposit"
            @withdraw="onWithdraw"
            @toggle-history="loadHistory"
          />
        </section>
      </section>

      <ion-modal
        :is-open="confirmDelete.open"
        css-class="reminder-confirm-modal"
        @didDismiss="onDeleteCancel"
      >
        <div class="reminder-confirm-card">
          <h3 class="reminder-confirm-title">Eliminar meta</h3>
          <p class="reminder-confirm-message">
            ¿Seguro que deseas eliminar "{{ confirmDelete.goal ? confirmDelete.goal.nombre : '' }}"?
          </p>
          <div class="reminder-confirm-actions">
            <ion-button
              class="confirm-btn confirm-btn--cancel"
              fill="solid"
              @click="onDeleteCancel"
              :disabled="removing"
            >
              Cancelar
            </ion-button>
            <ion-button
              class="confirm-btn confirm-btn--danger"
              fill="solid"
              @click="onDeleteDo"
              :disabled="removing"
            >
              Eliminar
            </ion-button>
          </div>
        </div>
      </ion-modal>

      <ion-toast :is-open="toast.open" :message="toast.message" :color="toast.color" duration="2200" @didDismiss="toast.open=false" />
    </ion-content>
  </ion-page>
  
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonSpinner, IonToast, IonModal, IonButton, onIonViewWillEnter } from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import GoalListItem from '@/components/GoalListItem.vue'
import { useGoals } from '@/composables/useGoals'
import '@/theme/MonthlyPanel.css'
import '@/theme/goals.css'
import '@/theme/RemindersPage.css'
import '@/theme/ExpenseForm.css'

const router = useRouter()
const { loading, error, goals, refresh, deposit, withdraw, fetchTransactions, formatCurrency, remove } = useGoals()
const transactionsMap = ref(new Map())
const confirmDelete = ref({ open: false, goal: null })
const removing = ref(false)
const collapseKey = ref(0)

function bumpCollapseKey(){
  collapseKey.value += 1
}

const toast = ref({ open: false, message: '', color: 'primary' })
function openToast(message, color='primary'){ toast.value = { open: true, message, color } }

onMounted(() => {
  refresh()
  bumpCollapseKey()
  window.addEventListener('data:goals-changed', refresh)
})

onUnmounted(() => {
  window.removeEventListener('data:goals-changed', refresh)
})

onIonViewWillEnter(() => {
  refresh().catch(() => {})
  bumpCollapseKey()
})

watch(goals, () => {
  bumpCollapseKey()
})

function goToEdit(id){ router.push(`/metas/${id}/editar`) }
function goToDelete(id){
  const goal = goals.value?.find(g => g.id === id) || null
  confirmDelete.value = { open: true, goal }
}
function onDeleteCancel(){
  confirmDelete.value = { open: false, goal: null }
  removing.value = false
}
async function onDeleteDo(){
  if (!confirmDelete.value.goal || removing.value) return
  try {
    removing.value = true
    await remove(confirmDelete.value.goal.id)
    openToast('Meta eliminada correctamente', 'success')
    onDeleteCancel()
  } catch (e) {
    openToast('No se pudo eliminar la meta. Intenta de nuevo.', 'danger')
  } finally {
    removing.value = false
  }
}

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
