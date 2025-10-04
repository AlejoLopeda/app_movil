<template>
  <div>
    <!-- Monto -->
    <ion-item :class="{ 'item-error': amountError }" class="with-prefix">
      <ion-label position="stacked">Monto</ion-label>
      <div class="input-prefix">$</div>
      <ion-input
        type="number"
        inputmode="decimal"
        placeholder="0.00"
        v-model.number="monto"
        @ionBlur="validateAmount"
        :style="{ '--padding-start': '22px' }"
      />
      <ion-icon slot="end" :icon="calculatorOutline"></ion-icon>
    </ion-item>
    <ion-note v-if="amountError" color="danger">{{ amountError }}</ion-note>

    <!-- Categorias -->
    <div class="section-label">Categorias</div>
    <div class="categories">
      <button
        v-for="c in categories"
        :key="c.key"
        class="cat-btn"
        :class="{ active: categoria === c.key }"
        @click="categoria = c.key"
      >
        <ion-icon :icon="iconFor(c.key)" />
        <span>{{ c.label }}</span>
      </button>
      <button class="cat-btn more" @click="openCategorias">
        <ion-icon :icon="addCircleOutline" />
        <span>Mas</span>
      </button>
    </div>
    <ion-note v-if="catError" color="danger">{{ catError }}</ion-note>

    <!-- Fecha -->
    <ion-item :class="{ 'item-error': dateError }">
      <ion-label position="stacked">Fecha</ion-label>
      <ion-input type="date" v-model="fecha" @ionBlur="validateDate" />
    </ion-item>
    <ion-note v-if="dateError" color="danger">{{ dateError }}</ion-note>

    <!-- Descripcion -->
    <ion-item>
      <ion-label position="stacked">Descripcion</ion-label>
      <ion-input placeholder="Opcional" v-model="descripcion" />
    </ion-item>

    <div class="actions">
      <ion-button expand="block" color="success" :disabled="!isValid || loading" @click="emitSubmit">
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

const isValid = computed(() => !amountError.value && !dateError.value && monto.value != null && Number(monto.value) > 0 && !!fecha.value)

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
.with-prefix { position: relative; }
.input-prefix {
  position: absolute;
  left: 12px;
  /* coloca el simbolo a la altura del input, no del label */
  top: 44px;
  z-index: 1;
  color: var(--ion-color-medium);
  font-weight: 600;
}

.section-label {
  margin: 16px 0 8px;
  font-weight: 600;
}

.categories {
  display: flex;
  gap: 12px;
  align-items: center;
}

.cat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--ion-color-medium);
  border-radius: 8px;
  min-width: 72px;
  background: white;
}

.cat-btn.active { border-color: var(--ion-color-primary); }
.cat-btn.more { border-style: dashed; }

.actions { margin-top: 20px; }

.item-error {
  --highlight-color-focused: var(--ion-color-danger);
  --highlight-color-invalid: var(--ion-color-danger);
  --border-color: var(--ion-color-danger);
}

ion-item ion-icon[slot="end"] { align-self: center; font-size: 20px; }
.categories ion-icon { font-size: 22px; color: var(--ion-color-primary); }
.cat-btn { background: var(--ion-color-light, #fff); }
.actions ion-button { --border-radius: 14px; }
</style>

