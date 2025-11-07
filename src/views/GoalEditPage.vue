<template>
  <ion-page class="monthly-page">
    <app-top-bar title="METAS" />
    <ion-content class="monthly-content ion-padding" fullscreen>
      <h2 class="goals-form__title">EDITAR META</h2>

      <ion-item lines="full">
        <ion-label position="stacked">Nombre</ion-label>
        <ion-input v-model="name" />
      </ion-item>

      <ion-item lines="full">
        <ion-label position="stacked">Monto a alcanzar</ion-label>
        <ion-input
          :value="amount"
          inputmode="decimal"
          type="text"
          @ionInput="onAmountInput"
        />
      </ion-item>

      <ion-item lines="full">
        <ion-label position="stacked">Comentario</ion-label>
        <ion-input v-model="comment" />
      </ion-item>

      <div class="goals-form__actions">
        <ion-button expand="block" :disabled="!canSubmit || busy" @click="onUpdate">ACTUALIZAR</ion-button>
      </div>

      <ion-toast :is-open="toast.open" :message="toast.message" :color="toast.color" duration="2200" @didDismiss="toast.open=false" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonButton, IonToast } from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import { useGoals } from '@/composables/useGoals'
import { sanitizePositiveDecimalInput, parsePositiveNumber } from '@/utils/numberUtils'
import '@/theme/MonthlyPanel.css'
import '@/theme/goals.css'

const route = useRoute()
const router = useRouter()
const { findById, update } = useGoals()

const id = Number(route.params.id)
const name = ref('')
const amount = ref('')
const comment = ref('')
const busy = ref(false)
const toast = ref({ open: false, message: '', color: 'primary' })

const amountValue = computed(() => parsePositiveNumber(amount.value))
const canSubmit = computed(() => name.value.trim().length > 0 && amountValue.value !== null)

function openToast(message, color='primary'){ toast.value = { open: true, message, color } }

function onAmountInput(ev){
  amount.value = sanitizePositiveDecimalInput(ev.detail?.value)
}

onMounted(async () => {
  try {
    const g = await findById(id)
    if (!g) {
      openToast('La meta seleccionada ya no existe.', 'warning')
      router.replace('/metas')
      return
    }
    name.value = g.nombre
    amount.value = sanitizePositiveDecimalInput(String(g.objetivo ?? ""))
    comment.value = g.descripcion || ''
  } catch (e) {
    openToast('No se pudo cargar la meta. Intenta nuevamente.', 'danger')
  }
})

async function onUpdate(){
  if (!canSubmit.value) return
  busy.value = true
  try {
    await update({ id, nombre: name.value.trim(), monto: amountValue.value, descripcion: comment.value || null })
    openToast('Meta actualizada con éxito.', 'success')
    router.replace('/metas')
  } catch (e) {
    openToast(e?.message || 'No se pudo actualizar la meta. Intenta de nuevo.', 'danger')
  } finally { busy.value = false }
}
</script>
