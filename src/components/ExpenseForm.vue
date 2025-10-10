<template>
  <div class="expense-form__card">
    <!-- Monto -->
    <ion-item
      class="expense-form__item with-prefix"
      :class="{ 'expense-form__item--error': amountError }"
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
          <p>Selecciona una categoria adicional para este gasto.</p>
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
    >
      <ion-label position="stacked" class="expense-form__label">Fecha</ion-label>
      <ion-input type="date" v-model="fecha" @ionBlur="validateDate" class="expense-form__input" />
    </ion-item>
    <ion-note v-if="dateError" color="danger" class="expense-form__note">{{ dateError }}</ion-note>

    <!-- Descripcion -->
    <ion-item class="expense-form__item">
      <ion-label position="stacked" class="expense-form__label">Descripcion</ion-label>
      <ion-input placeholder="Opcional" v-model="descripcion" class="expense-form__input" />
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
import { additionalCategories, presetCategories, resolveCategory } from '@/lib/expenseService'
import '@/theme/ExpenseCategories.css'

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

<style scoped>
.expense-form__card {
  background: #ffffff;
  border-radius: 24px;
  padding: clamp(18px, 5vw, 28px);
  box-shadow: 0 24px 48px -28px rgba(13, 63, 72, 0.45);
  display: grid;
  gap: 14px;
}

.expense-form__item {
  --background: #ffffff;
  --inner-border-width: 0;
  --border-width: 0;
  --highlight-height: 0;
  --padding-top: 12px;
  --padding-bottom: 12px;
  --padding-start: 16px;
  --inner-padding-end: 14px;
  border: 2px solid rgba(13, 63, 72, 0.14);
  border-radius: 18px;
  transition: border-color 0.2s ease;
}

.expense-form__item--error {
  border-color: var(--ion-color-danger);
  --highlight-color-focused: var(--ion-color-danger);
  --highlight-color-invalid: var(--ion-color-danger);
}

.expense-form__label {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  color: #0d2c33;
}

.with-prefix ion-input::part(prefix) {
  color: #0d3f48;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding-right: 4px;
}

.expense-form__input {
  font-weight: 600;
  color: #0d2c33;
}

.expense-form__icon {
  align-self: center;
  font-size: 22px;
  color: #0d3f48;
}

.section-label {
  margin: 22px 0 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #0d3f48;
  font-size: 0.76rem;
}

.expense-form__note {
  font-size: 0.78rem;
  font-weight: 600;
  margin-left: 4px;
}

.expense-form__actions {
  margin-top: 26px;
}

.expense-form__submit {
  --background: #cbdcff;
  --background-activated: #bcd3ff;
  --background-focused: #bcd3ff;
  --background-hover: #d8e6ff;
  --color: #0d2c33;
  --border-radius: 999px;
  font-weight: 700;
  letter-spacing: 0.08em;
  height: 48px;
}

@media (min-width: 640px) {
  .expense-form__card {
    gap: 18px;
    padding: 28px 32px;
  }

  .section-label {
    margin-top: 26px;
  }
}
</style>
