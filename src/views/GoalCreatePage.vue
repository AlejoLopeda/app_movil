<template>
  <ion-page class="monthly-page">
    <app-top-bar title="METAS" />
    <ion-content class="monthly-content ion-padding" fullscreen>
      <section class="monthly-section">
        <header class="monthly-header">
          <div>
            <h2 class="monthly-header__title">Crear Meta</h2>
            <p class="monthly-header__subtitle">Define tu objetivo y comentario</p>
          </div>
        </header>

        <div class="goals-form-card">
          <ion-item class="goals-form-item" lines="full">
            <ion-label position="stacked">Nombre</ion-label>
            <ion-input v-model="name" placeholder="Ej: Ahorro viaje" />
          </ion-item>

          <ion-item class="goals-form-item" lines="full">
            <ion-label position="stacked">Monto a alcanzar</ion-label>
            <ion-input v-model.number="amount" inputmode="decimal" type="number" placeholder="$" />
          </ion-item>

          <ion-item class="goals-form-item" lines="full">
            <ion-label position="stacked">Comentario</ion-label>
            <ion-input v-model="comment" placeholder="Opcional" />
          </ion-item>

          <div class="goals-form__actions">
            <ion-button expand="block" :disabled="!canSubmit || busy" @click="onCreate">CREAR</ion-button>
          </div>
        </div>

        <ion-toast :is-open="toast.open" :message="toast.message" :color="toast.color" duration="2200" @didDismiss="toast.open=false" />
      </section>
    </ion-content>
  </ion-page>
  
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonButton, IonToast } from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import { useGoals } from '@/composables/useGoals'
import '@/theme/MonthlyPanel.css'
import '@/theme/goals.css'

const router = useRouter()
const { create } = useGoals()

const name = ref('')
const amount = ref(null)
const comment = ref('')
const busy = ref(false)
const toast = ref({ open: false, message: '', color: 'primary' })

const canSubmit = computed(() => name.value.trim().length > 0 && Number(amount.value) > 0)

function openToast(message, color='primary'){ toast.value = { open: true, message, color } }

async function onCreate(){
  if (!canSubmit.value) return
  busy.value = true
  try {
    await create({ nombre: name.value.trim(), monto: Number(amount.value), descripcion: comment.value || null })
    openToast('Meta creada con éxito.', 'success')
    router.replace('/metas')
  } catch (e) {
    openToast(e?.message || 'No se pudo crear la meta. Intenta de nuevo.', 'danger')
  } finally { busy.value = false }
}
</script>
