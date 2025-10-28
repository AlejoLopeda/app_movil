<template>
  <div class="expense-form__card">
    <!-- Nombre -->
    <ion-item class="expense-form__item" :class="{ 'expense-form__item--error': nameError }" mode="ios">
      <ion-icon slot="start" :icon="personIcon" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Nombre</ion-label>
      <ion-input class="expense-form__input" placeholder="Ej. Pagar servicio de luz" v-model="nombre" @ionBlur="validateName" />
    </ion-item>
    <ion-note v-if="nameError" color="danger" class="expense-form__note">{{ nameError }}</ion-note>

    <!-- Frecuencia -->
    <ion-item class="expense-form__item" :class="{ 'expense-form__item--error': freqError }" mode="ios">
      <ion-icon slot="start" :icon="repeatIcon" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Frecuencia</ion-label>
      <ion-select mode="ios" interface="action-sheet" v-model="frecuencia" @ionChange="validateFrequency">
        <ion-select-option value="daily">Diario</ion-select-option>
        <ion-select-option value="weekly">Semanal</ion-select-option>
        <ion-select-option value="monthly">Mensual</ion-select-option>
        <ion-select-option value="custom">Personalizado</ion-select-option>
      </ion-select>
    </ion-item>
    <ion-note v-if="freqError" color="danger" class="expense-form__note">{{ freqError }}</ion-note>

    <!-- Intervalo personalizado -->
    <ion-item v-if="frecuencia==='custom'" class="expense-form__item" :class="{ 'expense-form__item--error': intervalError }" mode="ios">
      <ion-icon slot="start" :icon="repeatIcon" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Intervalo (días)</ion-label>
      <ion-input class="expense-form__input" type="number" inputmode="numeric" min="1" placeholder="Cada cuántos días" v-model.number="intervaloDias" @ionBlur="validateInterval" />
    </ion-item>
    <ion-note v-if="intervalError" color="danger" class="expense-form__note">{{ intervalError }}</ion-note>

    <!-- Fecha fin -->
    <ion-item class="expense-form__item" :class="{ 'expense-form__item--error': endDateError }" mode="ios">
      <ion-icon slot="start" :icon="calendarIcon" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Fecha fin</ion-label>
      <ion-input type="date" v-model="fechaFin" @ionBlur="validateEndDate" class="expense-form__input" />
      <ion-button slot="end" fill="clear" size="small" class="picker-icon-btn" @click="openDatePicker" aria-label="Elegir fecha">
        <ion-icon :icon="calendarIcon" />
      </ion-button>
    </ion-item>
    <ion-note v-if="endDateError" color="danger" class="expense-form__note">{{ endDateError }}</ion-note>

    <!-- Hora -->
    <ion-item class="expense-form__item" :class="{ 'expense-form__item--error': timeError }" mode="ios">
      <ion-icon slot="start" :icon="timeIcon" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Hora</ion-label>
      <ion-input type="time" v-model="hora" @ionBlur="validateTimeFlexible" class="expense-form__input" />
      <ion-button slot="end" fill="clear" size="small" class="picker-icon-btn" @click="openTimePicker" aria-label="Elegir hora">
        <ion-icon :icon="timeIcon" />
      </ion-button>
    </ion-item>
    <ion-note v-if="timeError" color="danger" class="expense-form__note">{{ timeError }}</ion-note>

    <!-- Comentario -->
    <ion-item class="expense-form__item" mode="ios">
      <ion-icon slot="start" :icon="commentIcon" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Comentario</ion-label>
      <ion-input placeholder="Opcional" v-model="comentario" class="expense-form__input" />
    </ion-item>

    <div v-if="showSubmit" class="expense-form__actions">
      <ion-button expand="block" class="expense-form__submit" :disabled="!isValid || loading" @click="emitSubmit">ACEPTAR</ion-button>
    </div>
  </div>

  <!-- Date picker modal -->
  <ion-modal :is-open="dateOpen" @didDismiss="dateOpen=false" class="form-picker-modal">
    <div class="form-picker">
      <ion-datetime presentation="date" prefer-wheel="true" locale="es-ES" :value="fechaFinTemp" @ionChange="onDateTempChange" />
      <div class="form-picker__actions">
        <ion-button fill="clear" class="form-picker__btn" @click="dateOpen=false">Cancelar</ion-button>
        <ion-button class="form-picker__btn form-picker__btn--ok" @click="applyDate">Aceptar</ion-button>
      </div>
    </div>
  </ion-modal>

  <!-- Time picker modal -->
  <ion-modal :is-open="timeOpen" @didDismiss="timeOpen=false" class="form-picker-modal">
    <div class="form-picker">
      <ion-datetime presentation="time" hour-cycle="h23" prefer-wheel="true" :value="timeTemp" @ionChange="onTimeTempChange" />
      <div class="form-picker__actions">
        <ion-button fill="clear" class="form-picker__btn" @click="timeOpen=false">Cancelar</ion-button>
        <ion-button class="form-picker__btn form-picker__btn--ok" @click="applyTime">Aceptar</ion-button>
      </div>
    </div>
  </ion-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IonItem, IonLabel, IonInput, IonNote, IonButton, IonSelect, IonSelectOption, IonIcon, IonModal, IonDatetime } from '@ionic/vue'
import { personOutline, repeatOutline, calendarOutline, timeOutline, chatbubbleOutline } from 'ionicons/icons'
import '@/theme/ExpenseForm.css'

const props = defineProps({
  loading: { type: Boolean, default: false },
  showSubmit: { type: Boolean, default: true },
  initial: { type: Object, default: null },
})
const loading = computed(() => props.loading)
const emit = defineEmits(['submit'])

// Icons
const personIcon = personOutline
const repeatIcon = repeatOutline
const calendarIcon = calendarOutline
const timeIcon = timeOutline
const commentIcon = chatbubbleOutline

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

const dateOpen = ref(false)
const timeOpen = ref(false)
const fechaFinTemp = ref('')
const timeTemp = ref('')

function validateName() {
  if (!nombre.value || !String(nombre.value).trim()) nameError.value = 'El nombre es requerido'
  else nameError.value = ''
}
function validateFrequency() { freqError.value = frecuencia.value ? '' : 'Selecciona una frecuencia' }
function validateInterval() {
  if (frecuencia.value === 'custom') {
    const n = Number(intervaloDias.value)
    if (!Number.isFinite(n) || n < 1) { intervalError.value = 'Ingresa un intervalo válido mayor a 0'; return }
  }
  intervalError.value = ''
}

function isValidDateString(s) {
  if (!s) return false
  const d = new Date(s)
  return !Number.isNaN(d.getTime())
}
function validateEndDate() { endDateError.value = isValidDateString(fechaFin.value) ? '' : 'Debes seleccionar una fecha válida' }

function openDatePicker() { fechaFinTemp.value = fechaFin.value || new Date().toISOString().slice(0, 10); dateOpen.value = true }
function onDateTempChange(ev) { const v = String(ev.detail?.value || ''); if (/^\d{4}-\d{2}-\d{2}/.test(v)) fechaFinTemp.value = v.slice(0, 10) }
function applyDate() { if (fechaFinTemp.value) { fechaFin.value = fechaFinTemp.value; validateEndDate() } dateOpen.value = false }

function validateTimeFlexible() {
  const raw = (hora.value || '').toString().trim()
  if (!raw) { timeError.value = ''; return }
  const ok = normalizeTimeString(raw) !== null
  timeError.value = ok ? '' : 'Hora inválida'
}
function openTimePicker() { timeTemp.value = (hora.value && /^\d{2}:\d{2}/.test(hora.value)) ? hora.value : new Date().toTimeString().slice(0, 5); timeOpen.value = true }
function onTimeTempChange(ev) { const v = String(ev.detail?.value || ''); const m = v.match(/(\d{2}):(\d{2})/); if (m) timeTemp.value = `${m[1]}:${m[2]}` }
function applyTime() { if (timeTemp.value) { hora.value = timeTemp.value; validateTimeFlexible() } timeOpen.value = false }

const isValid = computed(() => (
  !nameError.value && !freqError.value && !intervalError.value && !endDateError.value && !timeError.value &&
  !!nombre.value && !!frecuencia.value && isValidDateString(fechaFin.value) &&
  (frecuencia.value !== 'custom' || (Number(intervaloDias.value) >= 1))
))

function emitSubmit() {
  validateName(); validateFrequency(); validateInterval(); validateEndDate(); validateTimeFlexible()
  if (!isValid.value) return
  emit('submit', {
    nombre: String(nombre.value).trim(),
    frecuencia: frecuencia.value,
    intervaloDias: frecuencia.value === 'custom' ? Number(intervaloDias.value) : null,
    fechaFin: fechaFin.value,
    hora: normalizeTimeString((hora.value || '').toString().trim()),
    comentario: comentario.value || null,
  })
}

// Rellenar valores iniciales (edición)
watch(() => props.initial, (val) => {
  if (!val) return
  nombre.value = val.nombre ?? ''
  frecuencia.value = val.frecuencia ?? 'daily'
  intervaloDias.value = val.intervaloDias ?? 1
  fechaFin.value = val.fechaFin ?? ''
  hora.value = normalizeTimeString(val.hora ?? '') || ''
  comentario.value = val.comentario ?? ''
  nameError.value = freqError.value = intervalError.value = endDateError.value = timeError.value = ''
}, { immediate: true })

defineExpose({
  submit: () => { emitSubmit() },
  reset: () => {
    nombre.value = ''
    frecuencia.value = 'daily'
    intervaloDias.value = 1
    fechaFin.value = ''
    hora.value = ''
    comentario.value = ''
    nameError.value = freqError.value = intervalError.value = endDateError.value = timeError.value = ''
  },
})

// Normaliza hora a HH:MM 24h; devuelve null si inválida/vacía
function normalizeTimeString(input) {
  if (!input) return null
  const s = String(input).trim()
  const m = s.match(/^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm))?\s*$/i)
  if (!m) return null
  let hh = parseInt(m[1], 10)
  const mm = parseInt(m[2], 10)
  const suf = (m[4] || '').toLowerCase().replace(/\./g, '').replace(/\s+/g, '')
  if (mm < 0 || mm > 59) return null
  if (suf) {
    if (hh < 1 || hh > 12) return null
    const isPM = suf === 'pm'
    if (hh === 12) hh = isPM ? 12 : 0
    else if (isPM) hh += 12
  } else {
    if (hh < 0 || hh > 23) return null
  }
  const HH = hh.toString().padStart(2, '0')
  const MM = mm.toString().padStart(2, '0')
  return `${HH}:${MM}`
}
</script>
