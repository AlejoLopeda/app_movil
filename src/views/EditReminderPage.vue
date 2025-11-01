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
import { IonPage, IonContent, IonToast } from '@ionic/vue'
import ReminderForm from '@/components/ReminderForm.vue'
import { getReminder, updateReminder } from '@/services/reminderService'
import { upsertSchedulesForReminder, cancelSchedulesForReminder, ensurePermission } from '@/lib/localNotifications'
import '@/theme/ExpensePage.css'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta?.title || 'Editar Recordatorio')

const loading = ref(false)
const formRef = ref(null)
const initialValues = ref(null)

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
    const res = await updateReminder(id, {
      name: payload.nombre,
      frequency: payload.frecuencia,
      interval_days: payload.frecuencia === 'custom' ? Number(payload.intervaloDias) : null,
      end_date: payload.fechaFin,
      time_at: payload.hora || null,
      comment: payload.comentario || null,
    })
    showToast('Recordatorio actualizado', 'success')
    try {
      await ensurePermission()
      if (res?.row) {
        await upsertSchedulesForReminder(res.row)
      } else {
        // fallback: cancelar y avisar cambios
        await cancelSchedulesForReminder(id)
      }
    } catch {}
    try { window.dispatchEvent(new CustomEvent('reminders:changed', { detail: { action: 'updated', id } })) } catch {}
    // Redirigir directamente al panel de recordatorios
    router.replace({ name: 'Recordatorios' })
  } catch (e) {
    showToast('No se pudo actualizar', 'danger')
  } finally {
    loading.value = false
  }
}

// Bottom bar events
function onBottomAccept() {
  formRef.value?.submit?.()
}
function onBottomBack() {
  router.back()
}

onMounted(() => {
  loadData()
  window.addEventListener('bottom-accept', onBottomAccept)
  window.addEventListener('bottom-back', onBottomBack)
})
onBeforeUnmount(() => {
  window.removeEventListener('bottom-accept', onBottomAccept)
  window.removeEventListener('bottom-back', onBottomBack)
})
</script>

