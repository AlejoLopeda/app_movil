<template>
  <ion-page>
  <ion-content fullscreen class="initial-page">
  <div class="screen">
    <div class="card">
          <div class="amount-container">
            <h1 class="hero-title">INGRESE<br/>MONTO INICIAL</h1>

            <AmountInput
              v-model:value="raw"
              :showError="showError"
              :errorMsg="errorMsg"
              @dirty="touched.value = true"
              @blur="touched.value = true"
            />

            <ion-button class="initial-cta" expand="block" :disabled="!canSubmit || loading" @click="onAccept">
              ACEPTAR
            </ion-button>

            <ion-note v-if="err" color="danger" class="initial-backend">{{ err }}</ion-note>
          </div>
    </div>
  </div>

  <ion-toast
  :is-open="showSuccess"
  :message="successMsg"
  duration="2000"
  @didDismiss="goDashboard"
  color="success"
  position="bottom"          
  css-class="success-toast" 
/>
      
</ion-content>
</ion-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { IonPage, IonContent, IonButton, IonNote, IonToast } from '@ionic/vue'
import { useRouter } from 'vue-router'
import AmountInput from '@/components/AmountInput.vue'
import { useInitialAmount } from '@/composables/useInitialAmount'
import { fetchInitialAmount, saveInitialAmount } from '@/services/initialAmountService'

const r = useRouter()
// incluye showError del composable
const { raw, touched, loading, err, parsed, showError, errorMsg, canSubmit } = useInitialAmount()

// Estados para el toast de éxito
const showSuccess = ref(false)
const successMsg = ref('')

onMounted(async () => {
  const d = await fetchInitialAmount().catch(() => null)
  if (d?.initial_set_at) raw.value = String(d.initial_amount)
})

async function onAccept(){
  touched.value = true
  if (!canSubmit.value) return
  loading.value = true
  try{
    await saveInitialAmount(Number(parsed.value))
    // Mostrar toast 2s y luego redirigir en @didDismiss
    successMsg.value = 'Monto ingresado correctamente'
    showSuccess.value = true
  }catch(e){ err.value = e.message ?? 'No se pudo guardar. Revisa tu conexión.' }
  finally{ loading.value = false }
}

// Redirección cuando el toast se cierra
function goDashboard() {
  showSuccess.value = false
  r.replace('/balance')
}
</script>

<style src="../theme/initialAmount.css"></style>
