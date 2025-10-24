<template>
  <ion-page class="monthly-page">
    <app-top-bar :title="pageTitle" />
    <ion-content class="monthly-content ion-padding" fullscreen>
      <monthly-panel panel-type="income" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import MonthlyPanel from '@/components/MonthlyPanel.vue'

const route = useRoute()
const pageTitle = computed(() => route.meta?.title || 'INGRESOS')
</script>
