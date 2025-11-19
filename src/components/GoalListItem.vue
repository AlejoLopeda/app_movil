<template>
  <div class="goal-item expense-form__card reminder-card">
    <div
      class="goal-summary-area"
      role="button"
      tabindex="0"
      :aria-expanded="expanded ? 'true' : 'false'"
      @click="toggleExpanded"
      @keyup.enter.prevent="toggleExpanded"
      @keyup.space.prevent="toggleExpanded"
    >
      <div class="reminder-header goal-header">
        <div class="reminder-title-wrap goal-title-wrap">
          <div class="goal-title-row">
            <h3 class="reminders-title goal-title">{{ goal.nombre }}</h3>
            <span v-if="goal.cumplida" class="goal-chip">Completada</span>
          </div>
          <div class="goal-sub goal-progress-text">
            <span :class="{ 'is-complete': goal.cumplida }">
              {{ format(goal.ahorrado) }} / {{ format(goal.objetivo) }}
            </span>
          </div>
        </div>
        <div class="reminder-actions goal-actions">
          <ion-button
            class="action-btn action-btn--edit"
            size="small"
            fill="solid"
            @click.stop="emit('edit', goal.id)"
            aria-label="Editar meta"
          >
            <ion-icon :icon="pencilOutline" />
          </ion-button>
          <ion-button
            class="action-btn action-btn--delete"
            size="small"
            fill="solid"
            @click.stop="emit('delete', goal.id)"
            aria-label="Eliminar meta"
          >
            <ion-icon :icon="trashOutline" />
          </ion-button>
        </div>
      </div>

      <div class="goal-progress-wrapper">
        <goal-progress-bar :pct="goal.progreso_pct" :complete="goal.cumplida" />
      </div>

      <div class="goal-tap-hint reminder-tap-hint">{{ hintText }}</div>
    </div>

    <div v-if="expanded" class="goal-expand">
      <div class="goal-transfer">
        <ion-item lines="none" class="goal-inputs">
          <ion-input
            class="goal-amount-input"
            placeholder="$ monto"
            inputmode="decimal"
            type="text"
            :value="amount"
            @ionInput="onAmountInput"
          />
        </ion-item>
        <ion-item lines="none" class="goal-inputs">
          <ion-input
            class="goal-desc-input"
            placeholder="Descripción (opcional)"
            type="text"
            v-model="description"
          />
        </ion-item>
        <div class="goal-transfer-actions">
          <ion-button size="small" @click="onDeposit" :disabled="busy || !canSubmit">Poner</ion-button>
          <ion-button size="small" color="medium" @click="onWithdraw" :disabled="busy || !canSubmit">Quitar</ion-button>
        </div>
      </div>

      <div class="goal-history">
        <button class="goal-history__toggle" type="button" @click="toggleHistory">
          {{ showHistory ? 'Ocultar' : 'Ver' }} historial
        </button>
        <ul v-if="showHistory" class="goal-history__list">
          <li v-for="tx in transactions" :key="tx.id" class="goal-history__row">
            <span class="goal-history__amount" :class="{ inc: tx.amount>0, dec: tx.amount<0 }">{{ format(tx.amount) }}</span>
            <span class="goal-history__desc">{{ tx.description || '—' }}</span>
            <span class="goal-history__date">{{ new Date(tx.created_at).toLocaleString() }}</span>
          </li>
          <li v-if="!transactions.length" class="goal-history__row goal-history__row--empty">Sin movimientos.</li>
        </ul>
      </div>
    </div>

    <ion-toast :is-open="toast.open" :message="toast.message" :color="toast.color" duration="2200" @didDismiss="toast.open=false" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IonButton, IonIcon, IonItem, IonInput, IonToast } from '@ionic/vue'
import { pencilOutline, trashOutline } from 'ionicons/icons'
import GoalProgressBar from '@/components/GoalProgressBar.vue'
import { sanitizePositiveDecimalInput, parsePositiveNumber } from '@/utils/numberUtils'
import '@/theme/goals.css'

const props = defineProps({
  goal: { type: Object, required: true },
  format: { type: Function, required: true },
  transactions: { type: Array, default: () => [] },
  collapseKey: { type: [Number, String], default: 0 }
})
const emit = defineEmits(['edit','delete','deposit','withdraw','toggle-history'])

const expanded = ref(false)
const amount = ref('')
const description = ref('')
const busy = ref(false)
const showHistory = ref(false)

const toast = ref({ open: false, message: '', color: 'primary' })

const amountValue = computed(() => parsePositiveNumber(amount.value))
const canSubmit = computed(() => amountValue.value !== null)
const hintText = computed(() => expanded.value ? 'Toca para ocultar detalles' : 'Toca para ver más detalles')

function collapse() {
  expanded.value = false
  showHistory.value = false
}

function toggleExpanded() {
  expanded.value = !expanded.value
  if (!expanded.value) {
    showHistory.value = false
  }
}

function openToast(message, color='primary'){
  toast.value = { open: true, message, color }
}

function onAmountInput(ev){
  amount.value = sanitizePositiveDecimalInput(ev.detail?.value)
}


async function onDeposit(){
  if (!canSubmit.value) return
  try {
    busy.value = true
    await emit('deposit', { id: props.goal.id, amount: amountValue.value, description: description.value })
    amount.value=''
    description.value=''
    openToast('Abono registrado', 'success')
  } catch (e) {
    openToast(e?.message || 'No se pudo abonar', 'danger')
  } finally { busy.value=false }
}

async function onWithdraw(){
  if (!canSubmit.value) return
  try {
    busy.value = true
    await emit('withdraw', { id: props.goal.id, amount: amountValue.value, description: description.value })
    amount.value=''
    description.value=''
    openToast('Retiro registrado', 'success')
  } catch (e) {
    openToast(e?.message || 'No se pudo retirar', 'danger')
  } finally { busy.value=false }
}

function toggleHistory(){
  showHistory.value = !showHistory.value
  if (showHistory.value) emit('toggle-history', props.goal.id)
}

watch(() => props.goal?.id, () => {
  collapse()
  amount.value = ''
  description.value = ''
})

watch(() => props.collapseKey, () => {
  collapse()
})
</script>
