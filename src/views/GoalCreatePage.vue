<template>
  <ion-page class="expense-page goal-create-page">
    <app-top-bar title="METAS" />
    <ion-content
      class="expense-content ion-padding"
      fullscreen
      style="--padding-top: var(--ion-safe-area-top);"
    >
      <section class="expense-section">
        <goal-form
          ref="goalFormRef"
          class="goal-form"
          :loading="busy"
          :show-submit="false"
          @submit="handleSubmit"
        />
      </section>

      <ion-toast
        class="expense-toast"
        :is-open="toast.open"
        :message="toast.message"
        :color="toast.color"
        :duration="2200"
        @didDismiss="toast.open=false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import AppTopBar from '@/components/AppTopBar.vue'
import GoalForm from '@/components/GoalForm.vue'
import { IonPage, IonContent, IonToast } from '@ionic/vue'
import { useGoals } from '@/composables/useGoals'
import '@/theme/ExpensePage.css'
import '@/theme/goals.css'

const router = useRouter()
const { create } = useGoals()

const goalFormRef = ref(null)
const busy = ref(false)
const toast = ref({ open: false, message: '', color: 'primary' })

function showToast(message, color = 'primary') {
  toast.value = { open: true, message, color }
}

function onBottomAccept() {
  goalFormRef.value?.submit?.()
}
function onBottomBack() {
  goalFormRef.value?.reset?.()
}

onMounted(() => {
  globalThis.addEventListener('bottom-accept', onBottomAccept)
  globalThis.addEventListener('bottom-back', onBottomBack)
})
onBeforeUnmount(() => {
  globalThis.removeEventListener('bottom-accept', onBottomAccept)
  globalThis.removeEventListener('bottom-back', onBottomBack)
})

async function handleSubmit(payload) {
  if (busy.value) return
  busy.value = true
  try {
    await create({
      nombre: payload.name,
      monto: payload.amount,
      descripcion: payload.comment,
    })
    showToast('Meta creada con éxito', 'success')
    goalFormRef.value?.reset?.()
    setTimeout(() => router.replace('/metas'), 450)
  } catch (e) {
    showToast(e?.message || 'No se pudo crear la meta. Intenta de nuevo.', 'danger')
  } finally {
    busy.value = false
  }
}
</script>
