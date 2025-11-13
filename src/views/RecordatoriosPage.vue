<template>
  <ion-page class="reminders-page">
    <app-top-bar :title="pageTitle" />

    <ion-content
      class="reminders-content ion-padding"
      fullscreen
      style="--padding-top: var(--ion-safe-area-top);"
    >
      <section>
        <div v-if="items.length" class="reminders-list">
          <div
            v-for="r in items"
            :key="r.id"
            class="expense-form__card reminder-card"
            role="button"
            tabindex="0"
            @click="onDetails(r)"
            @keyup.enter="onDetails(r)"
          >
            <div class="reminder-header">
              <div class="reminder-title-wrap">
                <h3 class="reminders-title">{{ r.name }}</h3>
                <span class="reminder-chip">{{ labelFrecuencia(r) }}</span>
              </div>

              <div class="reminder-actions">
                <ion-button
                  class="action-btn action-btn--edit"
                  fill="solid"
                  size="small"
                  @click.stop="onEdit(r)"
                  aria-label="Editar"
                  title="Editar"
                >
                  <ion-icon :icon="createOutline" />
                </ion-button>

                <ion-button
                  class="action-btn action-btn--delete"
                  fill="solid"
                  size="small"
                  @click.stop="onDeleteAsk(r)"
                  aria-label="Eliminar"
                  title="Eliminar"
                >
                  <ion-icon :icon="trashOutline" />
                </ion-button>
              </div>
            </div>

            <div class="reminder-meta">
              <div class="meta-row">
                <ion-icon :icon="repeatOutline" class="meta-icon" />
                <strong>Frecuencia:</strong>
                <span class="meta-text">{{ labelFrecuencia(r) }}</span>
              </div>

              <div class="meta-row" v-if="r.time_at">
                <ion-icon :icon="timeOutline" class="meta-icon" />
                <strong>Hora:</strong>
                <span class="meta-text">{{ r.time_at }}</span>
              </div>

              <div class="meta-row">
                <ion-icon :icon="calendarOutline" class="meta-icon" />
                <strong>Fin:</strong>
                <span class="meta-text">{{ r.end_date }}</span>
              </div>
            </div>

            <div class="reminder-tap-hint">Toca para ver más detalles</div>
          </div>
        </div>

        <div v-else class="reminders-empty">
          <h2>Sin recordatorios</h2>
          <p>Usa el botón CREAR en la barra inferior.</p>
        </div>
      </section>

      <ion-modal
        :is-open="details.open"
        @didDismiss="details.open=false"
        css-class="reminder-details-modal"
      >
        <div class="reminder-modal">
          <div class="modal-header">
            <div class="modal-title">
              <ion-icon :icon="informationCircleOutline" class="modal-icon" />
              <div class="modal-title-text">
                <h3 class="reminders-title">{{ details.item?.name }}</h3>
                <span v-if="details.item" class="reminder-chip">
                  {{ labelFrecuencia(details.item) }}
                </span>
              </div>
            </div>

            <ion-button
              fill="clear"
              size="small"
              class="modal-close"
              @click="details.open=false"
              aria-label="Cerrar"
            >
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </div>

          <div class="modal-body">
            <p class="modal-line">
              <ion-icon :icon="repeatOutline" class="meta-icon" />
              <strong>Frecuencia:</strong>
              <span class="meta-text">
                {{ details.item ? labelFrecuencia(details.item) : '' }}
              </span>
            </p>

            <p v-if="details.item?.time_at" class="modal-line">
              <ion-icon :icon="timeOutline" class="meta-icon" />
              <strong>Hora:</strong>
              <span class="meta-text">{{ details.item?.time_at }}</span>
            </p>

            <p class="modal-line">
              <ion-icon :icon="calendarOutline" class="meta-icon" />
              <strong>Fin:</strong>
              <span class="meta-text">{{ details.item?.end_date }}</span>
            </p>

            <div v-if="details.item?.comment" class="modal-line modal-line--comment">
              <ion-icon :icon="chatbubbleOutline" class="meta-icon" />
              <div class="modal-col">
                <strong>Comentario:</strong>
                <p class="meta-text comment-text">
                  {{ details.item?.comment }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ion-modal>

      <ion-modal
        :is-open="confirm.open"
        css-class="reminder-confirm-modal"
        @didDismiss="onDeleteCancel"
      >
        <div class="reminder-confirm-card">
          <h3 class="reminder-confirm-title">Eliminar recordatorio</h3>
          <p class="reminder-confirm-message">¿Seguro que deseas eliminarlo?</p>
          <div class="reminder-confirm-actions">
            <ion-button
              class="confirm-btn confirm-btn--cancel"
              fill="solid"
              @click="onDeleteCancel"
            >
              Cancelar
            </ion-button>
            <ion-button
              class="confirm-btn confirm-btn--danger"
              fill="solid"
              @click="onDeleteDo"
            >
              Eliminar
            </ion-button>
          </div>
        </div>
      </ion-modal>

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
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { onIonViewWillEnter } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'
import AppTopBar from '@/components/AppTopBar.vue'
import {
  IonPage,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButton,
  IonModal,
  IonToast
} from '@ionic/vue'
import {
  add,
  createOutline,
  trashOutline,
  informationCircleOutline,
  timeOutline,
  calendarOutline,
  repeatOutline,
  closeOutline,
  chatbubbleOutline
} from 'ionicons/icons'
import { useReminders } from '@/composables/useReminders'
import { deactivateReminder } from '@/services/reminderService'
import { cancelSchedulesForReminder } from '@/lib/localNotifications'
import { showToast as showGlobalToast } from '@/stores/notify'
import '@/theme/ExpenseForm.css'
import '@/theme/RemindersPage.css'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta?.title || 'Recordatorios')

const { items, load } = useReminders()

onMounted(() => {
  load()
  try {
    window.addEventListener('reminders:changed', onRemindersChanged)
  } catch {}
})
onBeforeUnmount(() => {
  try {
    window.removeEventListener('reminders:changed', onRemindersChanged)
  } catch {}
})
onIonViewWillEnter(load)

function labelFrecuencia(r) {
  switch (r.frequency) {
    case 'daily': return 'Diario'
    case 'weekly': return 'Semanal'
    case 'monthly': return 'Mensual'
    case 'custom': return `Cada ${r.interval_days} días`
    default: return r.frequency
  }
}

const details = ref({ open: false, item: null })
function onDetails(item) {
  details.value = { open: true, item }
}

const toast = ref({ open: false, message: '', color: 'primary' })

function showToast(message, color = 'primary') {
  toast.value = { open: true, message, color }
}

function onEdit(item) {
  router.push({ name: 'EditReminder', params: { id: item.id } })
}

const confirm = ref({ open: false, item: null })
function onDeleteAsk(item) {
  confirm.value = { open: true, item }
}

function onDeleteCancel() {
  confirm.value = { open: false, item: null }
}

async function onDeleteDo() {
  const item = confirm.value.item
  onDeleteCancel()
  if (!item) return

  try {
    // 1) Desactivar en BD y recargar lista
    await deactivateReminder(item.id)
    await load()

    // 2) Cancelar notificaciones EN SEGUNDO PLANO (sin await)
    try {
      cancelSchedulesForReminder(item.id)
    } catch {}

    // 3) Feedback UI (esto ya no depende del plugin nativo)
    showToast('Recordatorio eliminado', 'success')
    showGlobalToast('Recordatorio eliminado correctamente', 'success', 'bottom')

    try {
      window.dispatchEvent(
        new CustomEvent('reminders:changed', {
          detail: { action: 'deleted', id: item.id }
        })
      )
    } catch {}
  } catch (e) {
    showToast('No se pudo eliminar', 'danger')
  }
}

function clearToastQuery() {
  if (!route?.query || route.query.toast === undefined) return
  const { toast: _ignored, ...rest } = route.query
  router.replace({ query: { ...rest } })
}

watch(
  () => route.query.toast,
  (action) => {
    if (action === 'created') {
      showToast('Recordatorio creado', 'success')
      clearToastQuery()
    } else if (action === 'updated') {
      showToast('Recordatorio actualizado', 'success')
      clearToastQuery()
    }
  },
  { immediate: true }
)

// Refrescar y mostrar toast al volver desde crear/editar
function onRemindersChanged(ev) {
  load()
  const action = ev?.detail?.action
  if (action === 'created') showToast('Recordatorio creado', 'success')
  else if (action === 'updated') showToast('Recordatorio actualizado', 'success')
}
</script>










