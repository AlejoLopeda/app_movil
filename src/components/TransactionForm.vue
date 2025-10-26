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

    <!-- Fecha -->
    <ion-item
      class="expense-form__item"
      :class="{ 'expense-form__item--error': dateError }"
      mode="ios"
    >
      <ion-icon slot="start" :icon="calendarOutline" class="expense-form__icon" />
      <ion-label position="stacked" class="expense-form__label">Fecha</ion-label>
      <ion-input type="date" v-model="fecha" @ionBlur="validateDate" class="expense-form__input" />
      <ion-button slot="end" fill="clear" size="small" class="picker-icon-btn" @click="openTxnDatePicker" aria-label="Elegir fecha">
        <ion-icon :icon="calendarOutline" />
      </ion-button>
    </ion-item>
    <ion-note v-if="dateError" color="danger" class="expense-form__note">{{ dateError }}</ion-note>

    <!-- Descripcion -->
    <ion-item class="expense-form__item" mode="ios">
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

  <!-- Date picker modal for transactions -->
  <ion-modal :is-open="txnDateOpen" @didDismiss="txnDateOpen=false" class="form-picker-modal">
    <div class="form-picker">
      <ion-datetime
        presentation="date"
        prefer-wheel="true"
        locale="es-ES"
        :value="txnFechaTemp"
        @ionChange="onTxnDateTempChange"
      />
      <div class="form-picker__actions">
        <ion-button fill="clear" class="form-picker__btn" @click="txnDateOpen=false">Cancelar</ion-button>
        <ion-button class="form-picker__btn form-picker__btn--ok" @click="applyTxnDate">Aceptar</ion-button>
      </div>
    </div>
  </ion-modal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { IonItem, IonLabel, IonInput, IonIcon, IonNote, IonButton, IonModal, IonDatetime } from '@ionic/vue'
import {
  calculatorOutline,
  addCircleOutline,
  // expense icons
  cashOutline,
  homeOutline,
  restaurantOutline,
  carOutline,
  schoolOutline,
  filmOutline,
  shirtOutline,
  airplaneOutline,
  pawOutline,
  giftOutline,
  medkitOutline,
  // income icons
  peopleOutline,
  briefcaseOutline,
  refreshOutline,
  cartOutline,
  walletOutline,
  calendarOutline,
  createOutline,
} from 'ionicons/icons'
import {
  additionalCategories as addExp,
  presetCategories as preExp,
  resolveCategory as resExp,
} from '@/services/expenseService'
import {
  additionalCategories as addInc,
  presetCategories as preInc,
  resolveCategory as resInc,
} from '@/services/incomeService'
import '@/theme/ExpenseCategories.css'
import '@/theme/ExpenseForm.css'

const props = defineProps({
  loading: { type: Boolean, default: false },
  mode: { type: String, default: 'expense' }, // 'expense' | 'income'
  /** ✅ NUEVO: muestra/oculta el botón interno de ACEPTAR */
  showSubmit: { type: Boolean, default: true },
})
const loading = computed(() => props.loading)
const mode = computed(() => (props.mode === 'income' ? 'income' : 'expense'))
const showSubmit = computed(() => props.showSubmit)
const emit = defineEmits(['submit'])

const monto = ref(null)
const categoria = ref(null)
const fecha = ref('')
const descripcion = ref('')

const amountError = ref('')
const dateError = ref('')
const catError = ref('')
const txnDateOpen = ref(false)
const txnFechaTemp = ref('')

/** ✅ Pasan a computed para reaccionar si cambia `mode` */
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
  // expense keys
  switch (key) {
    case 'salud': return medkitOutline
    case 'hogar': return homeOutline
    case 'comida': return restaurantOutline
    case 'transporte': return carOutline
    case 'educacion': return schoolOutline
    case 'entretenimiento': return filmOutline
    case 'ropa': return shirtOutline
    case 'viajes': return airplaneOutline
    case 'mascotas': return pawOutline
    case 'regalos': return giftOutline
    case 'otros': return cashOutline
  }
  // income keys
  switch (key) {
    case 'salario': return cashOutline
    case 'pension': return peopleOutline
    case 'comisiones': return briefcaseOutline
    case 'propinas': return restaurantOutline
    case 'reembolsos': return refreshOutline
    case 'ventas': return cartOutline
    case 'mesada': return walletOutline
  }
  return cashOutline
}

function validateAmount() {
  if (monto.value == null || isNaN(Number(monto.value)) || Number(monto.value) <= 0) {
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
    monto.value != null &&
    Number(monto.value) > 0 &&
    !!fecha.value
)

function openCategorias() { showMoreCategories.value = true }
function closeCategorias() { showMoreCategories.value = false }

// Date picker interactions for transactions
// (refs declarados arriba)
function openTxnDatePicker(){
  txnFechaTemp.value = fecha.value || new Date().toISOString().slice(0,10)
  txnDateOpen.value = true
}
function onTxnDateTempChange(ev){
  const v = String(ev.detail?.value || '')
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) txnFechaTemp.value = v.slice(0,10)
}
function applyTxnDate(){
  if (txnFechaTemp.value){
    fecha.value = txnFechaTemp.value
    validateDate()
  }
  txnDateOpen.value = false
}

function selectAdditionalCategory(key) {
  categoria.value = key
  showMoreCategories.value = false
}

function emitSubmit() {
  validateAmount()
  validateDate()
  if (!isValid.value) return
  emit('submit', {
    monto: Number(monto.value),
    categoria: categoria.value,
    fecha: fecha.value,
    descripcion: descripcion.value || null,
  })
}

/** ✅ Exponer submit() y reset() para que la navbar pueda usarlos */
defineExpose({
  submit: emitSubmit,
  reset: () => {
    monto.value = null
    categoria.value = null
    fecha.value = ''
    descripcion.value = ''
    amountError.value = ''
    dateError.value = ''
    catError.value = ''
  },
})
</script>
