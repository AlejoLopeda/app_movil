<template>
  <ion-page>
    <app-top-bar :title="pageTitle" />

    <ion-content class="ion-padding" fullscreen style="--padding-top: var(--ion-safe-area-top);">
      <section>
        <p>Pronto podrás gestionar tus recordatorios aquí.</p>
      </section>

      <ion-fab horizontal="end" vertical="bottom" slot="fixed">
        <ion-fab-button @click="goAdd">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppTopBar from '@/components/AppTopBar.vue'
import { IonPage, IonContent, IonFab, IonFabButton, IonIcon } from '@ionic/vue'
import { add } from 'ionicons/icons'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta?.title || 'Recordatorios')

function goAdd() {
  router.push({ name: 'AddReminder' })
}
</script>

