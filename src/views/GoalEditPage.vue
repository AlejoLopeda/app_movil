<template>
  <ion-page class="expense-page goal-edit-page">
    <app-top-bar title="METAS" />
    <ion-content
      class="expense-content ion-padding"
      fullscreen
      style="--padding-top: var(--ion-safe-area-top);"
    >
      <section class="expense-section">
        <template v-if="loaded">
          <goal-form
            ref="goalFormRef"
            class="goal-form"
            :loading="busy"
            :show-submit="false"
            :initial-name="initialName"
            :initial-amount="initialAmount"
            :initial-comment="initialComment"
            @submit="handleSubmit"
            @change="handleFormChange"
          />
        </template>
        <div v-else class="goal-edit__loading">
          <ion-spinner name="crescent" />
        </div>
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
import { onMounted, ref, onBeforeUnmount, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonToast, IonSpinner } from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import GoalForm from '@/components/GoalForm.vue'
import { useGoals } from '@/composables/useGoals'
import { sanitizePositiveDecimalInput } from '@/utils/numberUtils'
import '@/theme/ExpensePage.css'
import '@/theme/goals.css'

const route = useRoute()
const router = useRouter()
const { findById, update } = useGoals()

const id = Number(route.params.id)
const goalFormRef = ref(null)
const initialName = ref('')
const initialAmount = ref('')
const initialComment = ref('')
const loaded = ref(false)
const busy = ref(false)
const toast = ref({ open: false, message: '', color: 'primary' })
const formState = ref({ name: '', amount: '', comment: '', canSubmit: false })

function openToast(message, color = 'primary') {
  toast.value = { open: true, message, color }
}

const normalizedInitialName = computed(() => (initialName.value || '').trim())
const normalizedInitialComment = computed(() => (initialComment.value || '').trim())
const normalizedCurrentName = computed(() => (formState.value.name || '').trim())
const normalizedCurrentComment = computed(() => (formState.value.comment || '').trim())

const isDirty = computed(() => {
  const currentAmount = formState.value.amount ?? ''
  const initialAmountValue = initialAmount.value ?? ''
  return (
    normalizedCurrentName.value !== normalizedInitialName.value ||
    currentAmount !== initialAmountValue ||
    normalizedCurrentComment.value !== normalizedInitialComment.value
  )
})

const bottomAcceptEnabled = computed(
  () => loaded.value && !busy.value && formState.value.canSubmit && isDirty.value
)

function updateBottomCanSave(enabled) {
  globalThis.dispatchEvent(new CustomEvent('bottom-can-save', { detail: { enabled } }))
}

watch(
  bottomAcceptEnabled,
  enabled => updateBottomCanSave(enabled),
  { immediate: true }
)

function handleFormChange(payload = {}) {
  formState.value = {
    name: payload.name || '',
    amount: payload.amount ?? '',
    comment: payload.comment || '',
    canSubmit: !!payload.canSubmit,
  }
}

function onBottomAccept() {
  goalFormRef.value?.submit?.()
}
function onBottomBack() {
  router.replace('/metas')
}

onMounted(() => {
  globalThis.addEventListener('bottom-accept', onBottomAccept)
  globalThis.addEventListener('bottom-back', onBottomBack)
})

onBeforeUnmount(() => {
  globalThis.removeEventListener('bottom-accept', onBottomAccept)
  globalThis.removeEventListener('bottom-back', onBottomBack)
  updateBottomCanSave(false)
})

onMounted(async () => {
  try {
    const g = await findById(id)
    if (!g) {
      openToast('La meta seleccionada ya no existe.', 'warning')
      router.replace('/metas')
      return
    }
    initialName.value = g.nombre || ''
    initialAmount.value = sanitizePositiveDecimalInput(String(g.objetivo ?? ''))
    initialComment.value = g.descripcion || ''
    loaded.value = true
  } catch (e) {
    openToast('No se pudo cargar la meta. Intenta nuevamente.', 'danger')
  } finally {
    if (!loaded.value) loaded.value = true
  }
})

async function handleSubmit(payload) {
  if (busy.value) return
  busy.value = true
  try {
    await update({
      id,
      nombre: payload.name,
      monto: payload.amount,
      descripcion: payload.comment,
    })
    openToast('Meta actualizada con éxito.', 'success')
    router.replace('/metas')
  } catch (e) {
    openToast(e?.message || 'No se pudo actualizar la meta. Intenta de nuevo.', 'danger')
  } finally {
    busy.value = false
  }
}
</script>
