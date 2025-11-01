<template>
  <div class="expense-form__card">
    <!-- Nombre -->
    <ion-item class="expense-form__item" :class="{ 'expense-form__item--error': nameError }" mode="ios">
      <ion-icon slot="start" :icon="personIcon" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Nombre</ion-label>
      <ion-input class="expense-form__input" placeholder="Ej. Pagar servicio de luz" v-model="nombre" @ionBlur="validateName" maxlength="60" />
    </ion-item>
    <ion-note v-if="nameError" color="danger" class="expense-form__note">{{ nameError }}</ion-note>
    <ion-note v-else-if="String(nombre||'').length >= 60" color="medium" class="expense-form__note">Has alcanzado el límite de 60 caracteres</ion-note>

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
      <ion-input class="expense-form__input" type="number" inputmode="numeric" min="2" placeholder="Cada cuántos días (mín. 2)" v-model.number="intervaloDias" @ionInput="onIntervalInput" @ionBlur="validateInterval" />
    </ion-item>
    <ion-note v-if="intervalError" color="danger" class="expense-form__note">{{ intervalError }}</ion-note>

    <!-- Fecha fin -->
    <ion-item class="expense-form__item" :class="{ 'expense-form__item--error': endDateError }" mode="ios">
      <ion-icon slot="start" :icon="calendarIcon" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Fecha fin</ion-label>
      <ion-input type="date" v-model="fechaFin" :min="minEndDate" @ionBlur="validateEndDate" class="expense-form__input" />
    </ion-item>
    <ion-note v-if="endDateError" color="danger" class="expense-form__note">{{ endDateError }}</ion-note>
    <ion-note v-if="!endDateError && !fechaFin" color="medium" class="expense-form__note expense-form__note--hint">Toca para seleccionar una fecha</ion-note>

    <!-- Hora -->
    <ion-item class="expense-form__item" :class="{ 'expense-form__item--error': timeError }" mode="ios">
      <ion-icon slot="start" :icon="timeIcon" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Hora</ion-label>
      <ion-input type="time" v-model="hora" @ionBlur="validateTimeFlexible" class="expense-form__input" />
    </ion-item>
    <ion-note v-if="timeError" color="danger" class="expense-form__note">{{ timeError }}</ion-note>
    <ion-note v-if="!timeError && !hora" color="medium" class="expense-form__note expense-form__note--hint">Toca para seleccionar una hora</ion-note>

    <!-- Comentario -->
    <ion-item class="expense-form__item" mode="ios">
      <ion-icon slot="start" :icon="commentIcon" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Comentario</ion-label>
      <ion-input placeholder="Opcional" v-model="comentario" class="expense-form__input" maxlength="280" />
    </ion-item>
    <ion-note v-if="String(comentario||'').length >= 280" color="medium" class="expense-form__note">Has alcanzado el límite de 280 caracteres</ion-note>

    <div v-if="showSubmit" class="expense-form__actions">
      <ion-button expand="block" class="expense-form__submit" :disabled="!isValid || loading" @click="emitSubmit">ACEPTAR</ion-button>
    </div>
  </div>

  
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IonItem, IonLabel, IonInput, IonNote, IonButton, IonSelect, IonSelectOption, IonIcon } from '@ionic/vue'
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
const intervaloDias = ref(2)
const fechaFin = ref('')
const minEndDate = ref(new Date().toISOString().slice(0, 10))
const hora = ref('')
const comentario = ref('')

const nameError = ref('')
const freqError = ref('')
const intervalError = ref('')
const endDateError = ref('')
const timeError = ref('')

// Estados para antiguos pickers (ya no usados)
const dateOpen = ref(false)
const timeOpen = ref(false)
const fechaFinTemp = ref('')
const timeTemp = ref('')

function validateName() {
  const val = String(nombre.value || '').trim()
  if (!val) { nameError.value = 'El nombre es requerido'; return }
  if (val.length > 60) { nameError.value = 'Máximo 60 caracteres'; return }
  nameError.value = ''
}
function validateFrequency() { freqError.value = frecuencia.value ? '' : 'Selecciona una frecuencia' }
function validateInterval() {
  if (frecuencia.value === 'custom') {
    const n = Number(intervaloDias.value)
    if (!Number.isFinite(n) || n < 2) { intervalError.value = 'Ingresa un intervalo válido mayor o igual a 2'; return }
  }
  intervalError.value = ''
}

function isValidDateString(s) {
  if (!s) return false
  const d = new Date(s)
  return !Number.isNaN(d.getTime())
}
function validateEndDate() {
  const v = String(fechaFin.value || '')
  if (!isValidDateString(v)) { endDateError.value = 'Debes seleccionar una fecha válida'; return }
  if (v < minEndDate.value) { endDateError.value = 'La fecha no puede ser anterior a hoy'; return }
  endDateError.value = ''
}

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
  (frecuencia.value !== 'custom' || (Number(intervaloDias.value) >= 2))
))

function emitSubmit() {
  validateName(); validateFrequency(); validateInterval(); validateEndDate(); validateTimeFlexible()
  if (!isValid.value) return
  const nameOut = String(nombre.value).trim().slice(0, 60)
  const commentOut = (comentario.value ? String(comentario.value) : '').slice(0, 280)
  emit('submit', {
    nombre: nameOut,
    frecuencia: frecuencia.value,
    intervaloDias: frecuencia.value === 'custom' ? Number(intervaloDias.value) : null,
    fechaFin: fechaFin.value,
    hora: normalizeTimeString((hora.value || '').toString().trim()),
    comentario: commentOut || null,
  })
}

// Rellenar valores iniciales (edición)
watch(() => props.initial, (val) => {
  if (!val) return
  nombre.value = val.nombre ?? ''
  frecuencia.value = val.frecuencia ?? 'daily'
  intervaloDias.value = Math.max(Number(val.intervaloDias ?? 3), 3)
  fechaFin.value = (val.fechaFin && String(val.fechaFin) >= minEndDate.value) ? val.fechaFin : minEndDate.value
  hora.value = normalizeTimeString(val.hora ?? '') || ''
  comentario.value = val.comentario ?? ''
  nameError.value = freqError.value = intervalError.value = endDateError.value = timeError.value = ''
}, { immediate: true })

defineExpose({
  submit: () => { emitSubmit() },
  reset: () => {
    nombre.value = ''
    frecuencia.value = 'daily'
    intervaloDias.value = 2
    fechaFin.value = minEndDate.value
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


function onIntervalInput(ev) { try { const v = Number(ev?.detail?.value); if (Number.isFinite(v) && v <= 2) intervaloDias.value = 2 } catch {} }
