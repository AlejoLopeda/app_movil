<template>
  <div class="income-form__card">
    <!-- Monto -->
    <ion-item
      class="income-form__item with-prefix"
      :class="{ 'income-form__item--error': amountError }"
    >
      <ion-label position="stacked" class="income-form__label">Monto</ion-label>
      <div class="input-prefix">$</div>
      <ion-input
        class="income-form__input"
        type="number"
        inputmode="decimal"
        placeholder="0.00"
        v-model.number="monto"
        @ionBlur="validateAmount"
        :style="{ '--padding-start': '22px' }"
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
        <span>Mas</span>
      </button>
    </div>
    <ion-note v-if="catError" color="danger" class="income-form__note">{{ catError }}</ion-note>

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
import { IonItem, IonLabel, IonInput, IonIcon, IonNote, IonButton } from '@ionic/vue'
import { calculatorOutline, addCircleOutline, cashOutline, giftOutline, peopleOutline } from 'ionicons/icons'
import { presetCategories } from '@/lib/incomeService'

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

const categories = presetCategories()

function iconFor(key) {
  switch (key) {
    case 'salario':
      return cashOutline
    case 'regalos':
      return giftOutline
    case 'pension':
      return peopleOutline
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
  catError.value = 'La gestion de categorias aun no esta disponible'
  setTimeout(() => (catError.value = ''), 2500)
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
.income-form__card {
  background: #ffffff;
  border-radius: 24px;
  padding: clamp(18px, 5vw, 28px);
  box-shadow: 0 24px 48px -28px rgba(13, 63, 72, 0.45);
  display: grid;
  gap: 14px;
}

.income-form__item {
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

.income-form__item--error {
  border-color: var(--ion-color-danger);
  --highlight-color-focused: var(--ion-color-danger);
  --highlight-color-invalid: var(--ion-color-danger);
}

.income-form__label {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  color: #0d2c33;
}

.with-prefix {
  position: relative;
}

.input-prefix {
  position: absolute;
  top: 44px;
  left: 16px;
  z-index: 1;
  color: #0d3f48;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.income-form__input {
  font-weight: 600;
  color: #0d2c33;
}

.income-form__icon {
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

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-start;
}

.cat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  min-width: 76px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: #ecf3ff;
  color: #0d3f48;
  font-weight: 600;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 12px 24px -24px rgba(13, 63, 72, 0.6);
}

.cat-btn ion-icon {
  font-size: 22px;
}

.cat-btn.active {
  background: #cbdcff;
  border-color: rgba(13, 63, 72, 0.16);
  box-shadow: 0 14px 26px -20px rgba(13, 63, 72, 0.55);
}

.cat-btn.more {
  border: 1.5px dashed rgba(13, 63, 72, 0.4);
  background: transparent;
}

.income-form__note {
  font-size: 0.78rem;
  font-weight: 600;
  margin-left: 4px;
}

.income-form__actions {
  margin-top: 26px;
}

.income-form__submit {
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
  .income-form__card {
    gap: 18px;
    padding: 28px 32px;
  }

  .section-label {
    margin-top: 26px;
  }

  .cat-btn {
    min-width: 88px;
    padding: 12px 16px;
  }
}
</style>

