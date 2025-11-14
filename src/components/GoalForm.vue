<template>
  <div class="expense-form__card goal-form-card">
    <ion-item
      class="expense-form__item"
      :class="{ 'expense-form__item--error': nameError }"
      mode="ios"
    >
      <ion-icon slot="start" :icon="flagOutline" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Nombre</ion-label>
      <ion-input
        class="expense-form__input"
        placeholder="Ej: Ahorro viaje"
        v-model="name"
        @ionBlur="validateName"
      />
    </ion-item>
    <ion-note v-if="nameError" color="danger" class="expense-form__note">{{ nameError }}</ion-note>

    <ion-item
      class="expense-form__item with-prefix"
      :class="{ 'expense-form__item--error': amountError }"
      mode="ios"
    >
      <ion-icon slot="start" :icon="walletOutline" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Monto objetivo</ion-label>
      <span slot="start" class="expense-form__prefix">$</span>
      <ion-input
        class="expense-form__input"
        inputmode="decimal"
        type="text"
        placeholder="0.00"
        :value="amount"
        @ionInput="onAmountInput"
        @ionBlur="validateAmount"
      />
    </ion-item>
    <ion-note v-if="amountError" color="danger" class="expense-form__note">{{ amountError }}</ion-note>

    <ion-item class="expense-form__item expense-form__item--desc" mode="ios">
      <ion-icon slot="start" :icon="chatbubbleOutline" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Comentario</ion-label>
      <ion-input class="expense-form__input" placeholder="Opcional" v-model="comment" />
    </ion-item>

    <ion-note class="expense-form__note expense-form__note--hint">
      Describe tu objetivo para identificarlo rápidamente dentro del panel de metas.
    </ion-note>

    <div class="expense-form__actions" v-if="showSubmit">
      <ion-button
        expand="block"
        class="expense-form__submit"
        :disabled="!canSubmit || loading"
        @click="emitSubmit"
      >
        {{ submitLabel }}
      </ion-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { IonItem, IonLabel, IonInput, IonIcon, IonNote, IonButton } from '@ionic/vue'
import { flagOutline, walletOutline, chatbubbleOutline } from 'ionicons/icons'
import { sanitizePositiveDecimalInput, parsePositiveNumber } from '@/utils/numberUtils'
import '@/theme/ExpenseForm.css'
import '@/theme/GoalForm.css'

const props = defineProps({
  loading: { type: Boolean, default: false },
  showSubmit: { type: Boolean, default: true },
  submitLabel: { type: String, default: 'CREAR META' },
  initialName: { type: String, default: '' },
  initialAmount: { type: [String, Number], default: '' },
  initialComment: { type: String, default: '' },
})
const loading = computed(() => props.loading)
const showSubmit = computed(() => props.showSubmit)
const submitLabel = computed(() => props.submitLabel || 'CREAR META')
const emit = defineEmits(['submit', 'change'])

const name = ref('')
const amount = ref('')
const comment = ref('')
const nameError = ref('')
const amountError = ref('')

const amountValue = computed(() => parsePositiveNumber(amount.value))
const canSubmit = computed(
  () => !nameError.value && !amountError.value && name.value.trim().length > 0 && amountValue.value !== null
)

function validateName() {
  if (!name.value.trim()) nameError.value = 'El nombre es obligatorio'
  else nameError.value = ''
}

function onAmountInput(ev) {
  amount.value = sanitizePositiveDecimalInput(ev.detail?.value)
}

function validateAmount() {
  if (amountValue.value === null) amountError.value = 'Ingresa un monto mayor a cero'
  else amountError.value = ''
}

function emitSubmit() {
  validateName()
  validateAmount()
  if (!canSubmit.value) return
  emit('submit', {
    name: name.value.trim(),
    amount: amountValue.value,
    comment: comment.value.trim() || null,
  })
}

watch(
  [name, amount, comment, canSubmit],
  () => {
    emit('change', {
      name: name.value,
      amount: amount.value,
      comment: comment.value,
      canSubmit: canSubmit.value,
    })
  },
  { immediate: true }
)

watch(
  () => props.initialName,
  value => {
    name.value = value || ''
    nameError.value = ''
  },
  { immediate: true }
)
watch(
  () => props.initialAmount,
  value => {
    amount.value = sanitizePositiveDecimalInput(
      value === null || value === undefined ? '' : String(value)
    )
    amountError.value = ''
  },
  { immediate: true }
)
watch(
  () => props.initialComment,
  value => {
    comment.value = value || ''
  },
  { immediate: true }
)

defineExpose({
  submit: emitSubmit,
  reset: () => {
    name.value = ''
    amount.value = ''
    comment.value = ''
    nameError.value = ''
    amountError.value = ''
  },
})
</script>
