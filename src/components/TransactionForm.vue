<template>
  <div class="expense-form__card">
    <!-- Monto -->
    <ion-item
      class="expense-form__item with-prefix"
      :class="{ 'expense-form__item--error': amountError }"
      mode="ios"
    >
      <ion-label position="stacked" class="expense-form__label">Monto</ion-label>
      <ion-input
        class="expense-form__input"
        type="number"
        inputmode="decimal"
        placeholder="0.00"
        v-model.number="monto"
        @ionBlur="validateAmount"
        prefix="$"
      />
      <ion-icon slot="end" :icon="calculatorOutline" class="expense-form__icon" />
    </ion-item>
    <ion-note v-if="amountError" color="danger" class="expense-form__note">{{ amountError }}</ion-note>

    <!-- Categorias -->
    <div class="section-label">Categorias</div>
    <div class="categories">
      <button
        v-for="c in categories"
        :key="c.key"
        type="button"
        class="cat-btn"
        :class="{ active: categoria === c.key }"
        @click="categoria = c.key"
      >
        <ion-icon :icon="iconFor(c.key)" />
        <span>{{ c.label }}</span>
      </button>
      <button type="button" class="cat-btn more" @click="openCategorias">
        <ion-icon :icon="addCircleOutline" />
        <span>Mas</span>
      </button>
    </div>
    <ion-note v-if="catError" color="danger" class="expense-form__note">{{ catError }}</ion-note>

    <ion-modal
      class="expense-categories-modal"
      :is-open="showMoreCategories"
      @didDismiss="closeCategorias"
    >
      <div class="expense-categories-modal__content">
        <header class="expense-categories-modal__header">
          <h2>Mas categorias</h2>
          <p>Selecciona una categoria adicional para este {{ mode === 'income' ? 'ingreso' : 'gasto' }}.</p>
        </header>
        <div class="categories categories--modal">
          <button
            v-for="c in extendedCategories"
            :key="c.key"
            type="button"
            class="cat-btn"
            :class="{ active: categoria === c.key }"
            @click="selectAdditionalCategory(c.key)"
          >
            <ion-icon :icon="iconFor(c.key)" />
            <span>{{ c.label }}</span>
          </button>
        </div>
        <ion-button
          expand="block"
          class="expense-categories-modal__close"
          fill="clear"
          @click="closeCategorias"
        >
          Cerrar
        </ion-button>
      </div>
    </ion-modal>

    <!-- Fecha (nativo como Historial) -->
    <ion-item
      class="expense-form__item expense-form__item--date"
      :class="{ 'expense-form__item--error': dateError }"
      mode="ios"
    >
      <ion-icon slot="start" :icon="calendarOutline" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Fecha</ion-label>

      <!-- Igual que en Historial: usamos :value y @ionChange -->
      <ion-input
        class="expense-form__input"
        type="date"
        style="--color:#0b3a43; --placeholder-color:#0b3a43; color-scheme:light;"
        :value="fecha ? fecha.slice(0,10) : ''"
        @ionChange="onDateChange"
        @ionBlur="validateDate"
      />
    </ion-item>
    <ion-note v-if="dateError" color="danger" class="expense-form__note">{{ dateError }}</ion-note>

    <!-- Descripcion -->
    <ion-item class="expense-form__item expense-form__item--desc" mode="ios">
      <ion-icon slot="start" :icon="createOutline" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Descripcion</ion-label>
      <ion-input placeholder="Opcional" v-model="descripcion" class="expense-form__input" />
    </ion-item>

    <!-- ✅ Botón ACEPTAR controlable desde fuera -->
    <div class="expense-form__actions" v-if="showSubmit">
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
import { IonItem, IonLabel, IonInput, IonIcon, IonNote, IonButton, IonModal } from '@ionic/vue'
import {
  calculatorOutline,
  addCircleOutline,
  calendarOutline, createOutline,
} from 'ionicons/icons'
import { additionalCategories as addExp, presetCategories as preExp, resolveCategory as resExp } from '@/services/expenseService'
import { additionalCategories as addInc, presetCategories as preInc, resolveCategory as resInc } from '@/services/incomeService'
import { sanitizePositiveDecimalInput, parsePositiveNumber } from '@/utils/numberUtils'
import { iconForCategory } from '@/utils/categoryIcons'
import '@/theme/ExpenseCategories.css'
import '@/theme/ExpenseForm.css'

const props = defineProps({
  loading: { type: Boolean, default: false },
  mode: { type: String, default: 'expense' }, // 'expense' | 'income'
  showSubmit: { type: Boolean, default: true },
})
const loading = computed(() => props.loading)
const mode = computed(() => (props.mode === 'income' ? 'income' : 'expense'))
const showSubmit = computed(() => props.showSubmit)
const emit = defineEmits(['submit'])

const monto = ref('')
const categoria = ref(null)
const fecha = ref('')
const descripcion = ref('')

const amountValue = computed(() => parsePositiveNumber(monto.value))

const amountError = ref('')
const dateError = ref('')
const catError = ref('')

const baseCategories = computed(() => (mode.value === 'income' ? preInc() : preExp()))
const extendedCategories = computed(() => (mode.value === 'income' ? addInc() : addExp()))
const showMoreCategories = ref(false)

const categories = computed(() => {
  const current = [...baseCategories.value]
  if (!categoria.value) return current
  const alreadyListed = current.some((item) => item.key === categoria.value)
  if (alreadyListed) return current
  const extra = (mode.value === 'income' ? resInc : resExp)(categoria.value)
  return extra ? [...current, extra] : current
})

function iconFor(key) {
  return iconForCategory(key)
}

function onAmountInput(ev) {
  monto.value = sanitizePositiveDecimalInput(ev.detail?.value)
}

function validateAmount() {
  if (amountValue.value === null) {
    amountError.value = 'El monto debe ser mayor a 0'
  } else {
    amountError.value = ''
  }
}

function validateDate() {
  if (!fecha.value) {
    dateError.value = 'Debes seleccionar una fecha valida'
  } else {
    dateError.value = ''
  }
}

const isValid = computed(
  () =>
    !amountError.value &&
    !dateError.value &&
    amountValue.value !== null &&
    !!fecha.value
)


function openCategorias() { showMoreCategories.value = true }
function closeCategorias() { showMoreCategories.value = false }
function selectAdditionalCategory(key) {
  categoria.value = key
  showMoreCategories.value = false
}

/* Actualiza fecha desde el date nativo */
function onDateChange(ev) {
  const v = String(ev.detail?.value || '')
  fecha.value = v ? v.slice(0,10) : ''
}

function emitSubmit() {
  validateAmount()
  validateDate()
  if (!isValid.value) return
  emit('submit', {
    monto: amountValue.value,
    categoria: categoria.value,
    fecha: fecha.value,
    descripcion: descripcion.value || null,
  })
}

defineExpose({
  submit: emitSubmit,
  reset: () => {
    monto.value = ''
    categoria.value = null
    fecha.value = ''
    descripcion.value = ''
    amountError.value = ''
    dateError.value = ''
    catError.value = ''
  },
})
</script>
