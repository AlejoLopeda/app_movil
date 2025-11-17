<template>
  <ion-page class="expense-page">
    <app-top-bar :title="pageTitle" />

    <ion-content class="expense-content ion-padding" fullscreen style="--padding-top: var(--ion-safe-area-top);">
      <section class="expense-section">
        <ReminderForm
          ref="formRef"
          class="expense-form"
          :loading="loading"
          :show-submit="false"
          :initial="initialValues"
          @submit="handleSubmit"
          @dirty-change="onDirtyChange"
        />
      </section>

      <ion-toast
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppTopBar from '@/components/AppTopBar.vue'
import { IonPage, IonContent, IonToast, useIonRouter } from '@ionic/vue'
import ReminderForm from '@/components/ReminderForm.vue'
import { getReminder, updateReminder } from '@/services/reminderService'
import '@/theme/ExpensePage.css'

const route = useRoute()
const router = useRouter()
const ionRouter = useIonRouter()
const pageTitle = computed(() => route.meta?.title || 'Editar Recordatorio')

const loading = ref(false)
const formRef = ref(null)
const initialValues = ref(null)
const isDirty = ref(false)

const toast = ref({ open: false, message: '', color: 'primary' })
function showToast(message, color = 'primary') {
  toast.value = { open: true, message, color }
}

async function loadData() {
  const id = route.params.id
  if (!id) {
    showToast('Falta el identificador', 'danger')
    router.replace({ name: 'Recordatorios' })
    return
  }
  loading.value = true
  try {
    const row = await getReminder(id)
    if (!row) {
      showToast('No se encontró el recordatorio', 'danger')
      router.replace({ name: 'Recordatorios' })
      return
    }
    initialValues.value = {
      nombre: row.name || '',
      frecuencia: row.frequency || 'daily',
      intervaloDias: row.interval_days || 1,
      fechaFin: row.end_date || '',
      hora: row.time_at || '',
      comentario: row.comment || '',
    }
  } catch (e) {
    showToast('No se pudo cargar el recordatorio', 'danger')
    router.replace({ name: 'Recordatorios' })
  } finally {
    loading.value = false
  }
}

async function handleSubmit(payload) {
  const id = route.params.id
  if (!id) return
  if (loading.value) return
  loading.value = true
  try {
    await updateReminder(id, {
      name: payload.nombre,
      frequency: payload.frecuencia,
      interval_days: payload.frecuencia === 'custom' ? Number(payload.intervaloDias) : null,
      end_date: payload.fechaFin,
      time_at: payload.hora || null,
      comment: payload.comentario || null,
    })
    showToast('Recordatorio actualizado', 'success')
    const query = { toast: 'updated' }
    const search = new URLSearchParams(query).toString()
    const url = search ? `/recordatorios?${search}` : '/recordatorios'
    const navigated = ionRouter.navigate(url, 'back', 'replace')
    if (!navigated) {
      try {
        await router.replace({ path: '/recordatorios', query })
      } catch {
        try { await router.push({ path: '/recordatorios', query }) } catch {
          window.location.href = url
        }
      }
    }
  } catch (e) {
    showToast('No se pudo actualizar', 'danger')
  } finally {
    loading.value = false
  }
}

// Bottom bar events
function onBottomAccept() {
  if (isDirty.value) {
    formRef.value?.submit?.()
  }
}
function onBottomBack() {
  router.back()
}

function emitBottomCanSave(enabled) {
  try {
    globalThis.dispatchEvent(new CustomEvent('bottom-can-save', { detail: { enabled } }))
  } catch {}
}

function onDirtyChange(state) {
  const enabled = !!state
  isDirty.value = enabled
  emitBottomCanSave(enabled)
}

onMounted(() => {
  emitBottomCanSave(false)
  loadData()
  globalThis.addEventListener('bottom-accept', onBottomAccept)
  globalThis.addEventListener('bottom-back', onBottomBack)
})
onBeforeUnmount(() => {
  globalThis.removeEventListener('bottom-accept', onBottomAccept)
  globalThis.removeEventListener('bottom-back', onBottomBack)
  emitBottomCanSave(false)
})
</script>

