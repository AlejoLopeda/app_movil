<template>

  <ion-page class="reminders-page">

    <app-top-bar :title="pageTitle" />



    <ion-content class="reminders-content ion-padding" fullscreen style="--padding-top: var(--ion-safe-area-top);">

      <div style="display:flex; gap:.5rem; margin-bottom: .75rem; align-items:center;">
        <ion-button size="small" color="tertiary" @click="onTestNotifications" aria-label="Probar notificaciones">
          <ion-icon :icon="notificationsOutline" />
          &nbsp;Probar notificaciones
        </ion-button>
      </div>

      <section>

        <div v-if="items.length" class="reminders-list">

          <div v-for="r in items" :key="r.id" class="expense-form__card reminder-card">

            <div class="reminder-header">

              <div class="reminder-title-wrap">

                <h3 class="reminders-title">{{ r.name }}</h3>

                <span class="reminder-chip">{{ labelFrecuencia(r) }}</span>

              </div>

              <div class="reminder-actions">

                <ion-button fill="clear" size="small" @click="onDetails(r)" aria-label="Ver detalles">

                  <ion-icon :icon="informationCircleOutline" />

                </ion-button>

                <ion-button fill="clear" size="small" @click="onEdit(r)" aria-label="Editar">

                  <ion-icon :icon="createOutline" />

                </ion-button>

                <ion-button fill="clear" size="small" color="danger" @click="onDeleteAsk(r)" aria-label="Eliminar">

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

          </div>

        </div>



        <div v-else class="reminders-empty">
          <h2>Sin recordatorios</h2>
          <p>Usa el botón CREAR en la barra inferior.</p>
        </div>

      </section>
<ion-modal :is-open="details.open" @didDismiss="details.open=false" css-class="reminder-details-modal">

        <div class="reminder-modal">

          <div class="modal-header">

            <div class="modal-title">

              <ion-icon :icon="informationCircleOutline" class="modal-icon" />

              <div class="modal-title-text">

                <h3 class="reminders-title">{{ details.item?.name }}</h3>

                <span v-if="details.item" class="reminder-chip">{{ labelFrecuencia(details.item) }}</span>

              </div>

            </div>

            <ion-button fill="clear" size="small" class="modal-close" @click="details.open=false" aria-label="Cerrar">

              <ion-icon :icon="closeOutline" />

            </ion-button>

          </div>



          <div class="modal-body">

            <p class="modal-line">

              <ion-icon :icon="repeatOutline" class="meta-icon" />

              <strong>Frecuencia:</strong>

              <span class="meta-text">{{ details.item ? labelFrecuencia(details.item) : '' }}</span>

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

            <p v-if="details.item?.comment" class="modal-line">

              <ion-icon :icon="chatbubbleOutline" class="meta-icon" />

              <strong>Comentario:</strong>

              <span class="meta-text">{{ details.item?.comment }}</span>

            </p>

          </div>

        </div>

      </ion-modal>



      <ion-alert

        :is-open="confirm.open"

        header="Eliminar recordatorio"

        css-class="reminders-alert"

        message="Â¿Seguro que deseas eliminarlo?"

        :buttons="[

          { text: 'Cancelar', role: 'cancel', handler: () => confirm.open=false },

          { text: 'Eliminar', role: 'destructive', handler: onDeleteDo, cssClass: 'alert-btn--danger' }

        ]"

        @didDismiss="confirm.open=false"

      />



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
import { computed, onMounted, ref } from 'vue'
import { onIonViewWillEnter } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'
import AppTopBar from '@/components/AppTopBar.vue'
import { IonPage, IonContent, IonFab, IonFabButton, IonIcon, IonButton, IonModal, IonAlert, IonToast } from '@ionic/vue'
import { add, createOutline, trashOutline, informationCircleOutline, timeOutline, calendarOutline, repeatOutline, closeOutline, chatbubbleOutline, notificationsOutline } from 'ionicons/icons'
import { useReminders } from '@/composables/useReminders'
import { deactivateReminder } from '@/services/reminderService'
import { cancelSchedulesForReminder, debugTestNotification, ensurePermission, isNativeLN } from '@/lib/localNotifications'
import '@/theme/ExpenseForm.css'
import '@/theme/RemindersPage.css'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta?.title || "Recordatorios")

const { items, load } = useReminders()
onMounted(load)
onIonViewWillEnter(load)

function labelFrecuencia(r) {
  switch (r.frequency) {
    case "daily": return "Diario"
    case "weekly": return "Semanal"
    case "monthly": return "Mensual"
    case "custom": return `Cada ${r.interval_days} días`
    default: return r.frequency
  }
}

const details = ref({ open: false, item: null })
function onDetails(item) {
  details.value = { open: true, item }
}

function showToast(message, color = "primary") {
  toast.value = { open: true, message, color }
}

function onEdit(item) {
  router.push({ name: 'EditReminder', params: { id: item.id } })
}

async function onTestNotifications() {
  try {
    if (!isNativeLN()) {
      showToast('Solo disponible en dispositivo', 'warning')
      return
    }
    const perm = await ensurePermission()
    if (!perm?.granted) {
      showToast('Concede permiso de notificaciones y reintenta', 'danger')
      return
    }
    const res = await debugTestNotification(3000)
    if (res?.ok) {
      showToast('Notificación de prueba en 3s', 'success')
    } else {
      showToast('No se pudo programar la prueba', 'danger')
    }
  } catch {
    showToast('Fallo al probar notificaciones', 'danger')
  }
}

const confirm = ref({ open: false, item: null })
function onDeleteAsk(item) {
  confirm.value = { open: true, item }
}

async function onDeleteDo() {
  const item = confirm.value.item
  confirm.value.open = false
  if (!item) return
  try {
    await deactivateReminder(item.id)
    await load()
    try { await cancelSchedulesForReminder(item.id) } catch {}
    showToast("Recordatorio eliminado", "success")
    try { window.dispatchEvent(new CustomEvent('reminders:changed', { detail: { action: 'deleted', id: item.id } })) } catch {}
  } catch (e) {
    showToast("No se pudo eliminar", "danger")
  }
}

const toast = ref({ open: false, message: "", color: "primary" })
</script>









