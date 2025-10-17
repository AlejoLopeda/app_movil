<template>
  <ion-page class="reminders-page">
    <app-top-bar :title="pageTitle" />

    <ion-content class="reminders-content ion-padding" fullscreen style="--padding-top: var(--ion-safe-area-top);">
      <section>
        <ion-list v-if="items.length">
          <ion-item v-for="r in items" :key="r.id" lines="full">
            <ion-label>
              <h3 class="reminders-title">{{ r.name }}</h3>
              <p>
                <strong>Frecuencia:</strong> {{ labelFrecuencia(r) }}
                <span v-if="r.time_at"> • <strong>Hora:</strong> {{ r.time_at }}</span>
                <span> • <strong>Fin:</strong> {{ r.end_date }}</span>
              </p>
            </ion-label>
          </ion-item>
        </ion-list>

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
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppTopBar from '@/components/AppTopBar.vue'
import { IonPage, IonContent, IonFab, IonFabButton, IonIcon, IonList, IonItem, IonLabel } from '@ionic/vue'
import { add } from 'ionicons/icons'
import { useReminders } from '@/composables/useReminders'
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
</script>
