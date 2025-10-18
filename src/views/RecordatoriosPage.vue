<template>
  <ion-page class="reminders-page">
    <app-top-bar :title="pageTitle" />

    <ion-content class="reminders-content ion-padding" fullscreen style="--padding-top: var(--ion-safe-area-top);">
      <section>
        <div v-if="items.length" class="reminders-list">
          <div v-for="r in items" :key="r.id" class="expense-form__card reminder-card">
            <div class="reminder-header">
              <h3 class="reminders-title">{{ r.name }}</h3>
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
              <div class="meta-row"><strong>Frecuencia:</strong> {{ labelFrecuencia(r) }}</div>
              <div class="meta-row" v-if="r.time_at"><strong>Hora:</strong> {{ r.time_at }}</div>
              <div class="meta-row"><strong>Fin:</strong> {{ r.end_date }}</div>
            </div>
          </div>
        </div>

        <div v-else class="reminders-empty">
          <h2>Sin recordatorios</h2>
          <p>Crea tu primer recordatorio con el botón “+”.</p>
        </div>
      </section>

      <ion-fab horizontal="end" vertical="bottom" slot="fixed">
        <ion-fab-button class="reminders-fab" @click="goAdd">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-fab>

      <ion-modal :is-open="details.open" @didDismiss="details.open=false">
        <div class="reminder-modal">
          <h3 class="reminders-title" style="margin-bottom:8px;">{{ details.item?.name }}</h3>
          <p class="modal-line"><strong>Frecuencia:</strong> {{ details.item ? labelFrecuencia(details.item) : '' }}</p>
          <p v-if="details.item?.time_at" class="modal-line"><strong>Hora:</strong> {{ details.item?.time_at }}</p>
          <p class="modal-line"><strong>Fin:</strong> {{ details.item?.end_date }}</p>
          <p v-if="details.item?.comment" class="modal-line"><strong>Comentario:</strong> {{ details.item?.comment }}</p>
        </div>
      </ion-modal>

      <ion-alert
        :is-open="confirm.open"
        header="Eliminar recordatorio"
        message="¿Seguro que deseas eliminarlo?"
        :buttons="[
          { text: 'Cancelar', role: 'cancel', handler: () => confirm.open=false },
          { text: 'Eliminar', role: 'destructive', handler: onDeleteDo }
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
import { useRoute, useRouter } from 'vue-router'
import AppTopBar from '@/components/AppTopBar.vue'
import { IonPage, IonContent, IonFab, IonFabButton, IonIcon, IonButton, IonModal, IonAlert, IonToast } from '@ionic/vue'
import { add, createOutline, trashOutline, informationCircleOutline } from 'ionicons/icons'
import { useReminders } from '@/composables/useReminders'
import { deactivateReminder } from '@/services/reminderService'
import '@/theme/ExpenseForm.css'
import '@/theme/RemindersPage.css'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta?.title || 'Recordatorios')

const { items, load } = useReminders()
onMounted(load)

function labelFrecuencia(r) {
  switch (r.frequency) {
    case 'daily': return 'Diario'
    case 'weekly': return 'Semanal'
    case 'monthly': return 'Mensual'
    case 'custom': return `Cada ${r.interval_days} días`
    default: return r.frequency
  }
}

function goAdd() {
  router.push({ name: 'AddReminder' })
}

const details = ref({ open: false, item: null })
function onDetails(item) {
  details.value = { open: true, item }
}

function showToast(message, color = 'primary') {
  toast.value = { open: true, message, color }
}

function onEdit(item) {
  // Placeholder: navegación a la página de creación. Edición completa se puede añadir luego.
  showToast('Edición próximamente')
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
    showToast('Recordatorio eliminado', 'success')
  } catch (e) {
    showToast('No se pudo eliminar', 'danger')
  }
}

const toast = ref({ open: false, message: '', color: 'primary' })
</script>
