<template>
  <div class="income-form__card">
    <!-- Monto -->
    <ion-item
      class="income-form__item with-prefix"
      :class="{ 'income-form__item--error': amountError }"
    >
      <ion-label position="stacked" class="income-form__label">Monto</ion-label>
      <ion-input
        class="income-form__input"
        type="number"
        inputmode="decimal"
        placeholder="0.00"
        v-model.number="monto"
        @ionBlur="validateAmount"
        prefix="$"
      />
      <ion-icon slot="end" :icon="calculatorOutline" class="income-form__icon" />
    </ion-item>
    <ion-note v-if="amountError" color="danger" class="income-form__note">{{ amountError }}</ion-note>

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
        <span>Más</span>
      </button>
    </div>
    <ion-note v-if="catError" color="danger" class="income-form__note">{{ catError }}</ion-note>

    <ion-modal
      class="income-categories-modal"
      :is-open="showMoreCategories"
      @didDismiss="closeCategorias"
    >
      <div class="income-categories-modal__content">
        <header class="income-categories-modal__header">
          <h2>Más categorías</h2>
          <p>Selecciona una categoría adicional para este ingreso.</p>
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
          class="income-categories-modal__close"
          fill="clear"
          @click="closeCategorias"
        >
          Cerrar
        </ion-button>
      </div>
    </ion-modal>

    <!-- Fecha -->
    <ion-item
      class="income-form__item"
      :class="{ 'income-form__item--error': dateError }"
    >
      <ion-label position="stacked" class="income-form__label">Fecha</ion-label>
      <ion-input type="date" v-model="fecha" @ionBlur="validateDate" class="income-form__input" />
    </ion-item>
    <ion-note v-if="dateError" color="danger" class="income-form__note">{{ dateError }}</ion-note>

    <!-- Descripcion -->
    <ion-item class="income-form__item">
      <ion-label position="stacked" class="income-form__label">Descripcion</ion-label>
      <ion-input placeholder="Opcional" v-model="descripcion" class="income-form__input" />
    </ion-item>

    <div class="income-form__actions">
      <ion-button
        expand="block"
        class="income-form__submit"
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
  cashOutline,
  giftOutline,
  peopleOutline,
  briefcaseOutline,
  restaurantOutline,
  refreshOutline,
  cartOutline,
  walletOutline,
} from 'ionicons/icons'
import { additionalCategories, presetCategories, resolveCategory } from '@/services/incomeService'
import '@/theme/IncomeCategories.css'
import '@/theme/IncomeForm.css'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})
const loading = computed(() => props.loading)
const emit = defineEmits(['submit'])

const monto = ref(null)
const categoria = ref(null)
const fecha = ref('')
const descripcion = ref('')

const amountError = ref('')
const dateError = ref('')
const catError = ref('')

const baseCategories = presetCategories()
const extendedCategories = additionalCategories()
const showMoreCategories = ref(false)

const categories = computed(() => {
  const current = [...baseCategories]
  if (!categoria.value) return current

  const alreadyListed = current.some((item) => item.key === categoria.value)
  if (alreadyListed) return current

  const extra = resolveCategory(categoria.value)
  return extra ? [...current, extra] : current
})

function iconFor(key) {
  switch (key) {
    case 'salario':
      return cashOutline
    case 'regalos':
      return giftOutline
    case 'pension':
      return peopleOutline
    case 'comisiones':
      return briefcaseOutline
    case 'propinas':
      return restaurantOutline
    case 'reembolsos':
      return refreshOutline
    case 'ventas':
      return cartOutline
    case 'mesada':
      return walletOutline
    default:
      return cashOutline
  }
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

function openCategorias() {
  showMoreCategories.value = true
}

function closeCategorias() {
  showMoreCategories.value = false
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

defineExpose({
  reset: () => {
    monto.value = null
    categoria.value = null
    fecha.value = ''
    descripcion.value = ''
  },
})
</script>

