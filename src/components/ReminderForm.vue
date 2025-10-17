<template>
  <div class="expense-form__card">
    <!-- Nombre -->
    <ion-item class="expense-form__item" :class="{ 'expense-form__item--error': nameError }">
      <ion-label position="stacked" class="expense-form__label">Nombre</ion-label>
      <ion-input
        class="expense-form__input"
        placeholder="Ej. Pagar servicio de luz"
        v-model="nombre"
        @ionBlur="validateName"
      />
    </ion-item>
    <ion-note v-if="nameError" color="danger" class="expense-form__note">{{ nameError }}</ion-note>

    <!-- Frecuencia -->
    <ion-item class="expense-form__item" :class="{ 'expense-form__item--error': freqError }">
      <ion-label position="stacked" class="expense-form__label">Frecuencia</ion-label>
      <ion-select interface="popover" v-model="frecuencia" @ionChange="validateFrequency">
        <ion-select-option value="daily">Diario</ion-select-option>
        <ion-select-option value="weekly">Semanal</ion-select-option>
        <ion-select-option value="monthly">Mensual</ion-select-option>
        <ion-select-option value="custom">Personalizado</ion-select-option>
      </ion-select>
    </ion-item>
    <ion-note v-if="freqError" color="danger" class="expense-form__note">{{ freqError }}</ion-note>

    <ion-item v-if="frecuencia==='custom'" class="expense-form__item" :class="{ 'expense-form__item--error': intervalError }">
      <ion-label position="stacked" class="expense-form__label">Intervalo (días)</ion-label>
      <ion-input
        class="expense-form__input"
        type="number"
        inputmode="numeric"
        min="1"
        placeholder="Cada cuántos días"
        v-model.number="intervaloDias"
        @ionBlur="validateInterval"
      />
    </ion-item>
    <ion-note v-if="intervalError" color="danger" class="expense-form__note">{{ intervalError }}</ion-note>

    <!-- Fecha fin -->
    <ion-item class="expense-form__item" :class="{ 'expense-form__item--error': endDateError }">
      <ion-label position="stacked" class="expense-form__label">Fecha fin</ion-label>
      <ion-input type="date" v-model="fechaFin" @ionBlur="validateEndDate" class="expense-form__input" />
    </ion-item>
    <ion-note v-if="endDateError" color="danger" class="expense-form__note">{{ endDateError }}</ion-note>

    <!-- Hora -->
    <ion-item class="expense-form__item" :class="{ 'expense-form__item--error': timeError }">
      <ion-label position="stacked" class="expense-form__label">Hora</ion-label>
      <ion-input type="time" v-model="hora" @ionBlur="validateTime" class="expense-form__input" />
    </ion-item>
    <ion-note v-if="timeError" color="danger" class="expense-form__note">{{ timeError }}</ion-note>

    <!-- Comentario -->
    <ion-item class="expense-form__item">
      <ion-label position="stacked" class="expense-form__label">Comentario</ion-label>
      <ion-input placeholder="Opcional" v-model="comentario" class="expense-form__input" />
    </ion-item>

    <div class="expense-form__actions">
      <ion-button
        expand="block"
        class="expense-form__submit"
        :disabled="!isValid || loading"
        @click="emitSubmit"
      >
        ACEPTAR
      </ion-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  IonItem, IonLabel, IonInput, IonNote, IonButton, IonSelect, IonSelectOption
} from '@ionic/vue'
import '@/theme/ExpenseForm.css'

const props = defineProps({
  loading: { type: Boolean, default: false },
})
const loading = computed(() => props.loading)
const emit = defineEmits(['submit'])

const nombre = ref('')
const frecuencia = ref('daily')
const intervaloDias = ref(1)
const fechaFin = ref('')
const hora = ref('')
const comentario = ref('')

const nameError = ref('')
const freqError = ref('')
const intervalError = ref('')
const endDateError = ref('')
const timeError = ref('')

function validateName() {
  if (!nombre.value || !String(nombre.value).trim()) {
    nameError.value = 'El nombre es requerido'
  } else {
    nameError.value = ''
  }
}

function validateFrequency() {
  if (!frecuencia.value) {
    freqError.value = 'Selecciona una frecuencia'
  } else {
    freqError.value = ''
  }
}

function validateInterval() {
  if (frecuencia.value === 'custom') {
    const n = Number(intervaloDias.value)
    if (!Number.isFinite(n) || n < 1) {
      intervalError.value = 'Ingresa un intervalo válido (>= 1)'
      return
    }
  }
  intervalError.value = ''
}

function isValidDateString(s) {
  if (!s) return false
  const d = new Date(s)
  return !Number.isNaN(d.getTime())
}

function validateEndDate() {
  if (!isValidDateString(fechaFin.value)) {
    endDateError.value = 'Debes seleccionar una fecha válida'
  } else {
    endDateError.value = ''
  }
}

function validateTime() {
  if (!hora.value) { timeError.value = '' ; return }
  // HH:MM 24h
  const ok = /^\d{2}:\d{2}$/.test(hora.value)
  timeError.value = ok ? '' : 'Hora inválida'
}

const isValid = computed(() => {
  return (
    !nameError.value &&
    !freqError.value &&
    !intervalError.value &&
    !endDateError.value &&
    !timeError.value &&
    !!nombre.value &&
    !!frecuencia.value &&
    isValidDateString(fechaFin.value) &&
    (frecuencia.value !== 'custom' || (Number(intervaloDias.value) >= 1))
  )
})

function emitSubmit() {
  validateName()
  validateFrequency()
  validateInterval()
  validateEndDate()
  validateTime()
  if (!isValid.value) return
  emit('submit', {
    nombre: String(nombre.value).trim(),
    frecuencia: frecuencia.value,
    intervaloDias: frecuencia.value === 'custom' ? Number(intervaloDias.value) : null,
    fechaFin: fechaFin.value,
    hora: hora.value || null,
    comentario: comentario.value || null,
  })
}

defineExpose({
  reset: () => {
    nombre.value = ''
    frecuencia.value = 'daily'
    intervaloDias.value = 1
    fechaFin.value = ''
    hora.value = ''
    comentario.value = ''
    nameError.value = ''
    freqError.value = ''
    intervalError.value = ''
    endDateError.value = ''
    timeError.value = ''
  },
})
</script>

