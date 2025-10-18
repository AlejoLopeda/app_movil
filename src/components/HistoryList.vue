<template>
  <section class="history-list ion-padding-horizontal">
    <ion-card v-if="error" class="state-card error">
      <ion-card-content>No se pudo cargar la información. Intenta de nuevo.</ion-card-content>
    </ion-card>

    <ion-card v-else-if="!loading && !items.length" class="state-card">
      <ion-card-content>{{ emptyMessage }}</ion-card-content>
    </ion-card>

    <div v-else-if="loading" class="skeleton-wrap">
      <div class="row-skeleton" v-for="n in 6" :key="n" />
    </div>

    <ion-list v-else>
      <ion-item v-for="it in items" :key="it.id" class="history-row" :class="it.type">
        <ion-avatar slot="start" class="row-icon">
          <div class="ic" :class="it.type">
            <ion-icon :icon="it.type==='income' ? arrowUpCircleOutline : arrowDownCircleOutline" />
          </div>
        </ion-avatar>

        <ion-label>
          <h3 class="row-title">{{ it.title }}</h3>
          <p class="row-sub">{{ formatDate(it.date) }} • {{ it.categoryLabel }}</p>
        </ion-label>

        <div slot="end" class="row-amount" :class="it.type">
          {{ formatMoney(it.amount) }}
        </div>
      </ion-item>
    </ion-list>
  </section>
</template>

<script setup>
import { IonList, IonItem, IonAvatar, IonLabel, IonIcon, IonCard, IonCardContent } from '@ionic/vue'
import { arrowUpCircleOutline, arrowDownCircleOutline } from 'ionicons/icons'

defineProps({
  items: { type: Array, default: () => [] },
  loading: Boolean,
  error: String,
  emptyMessage: String,
  formatMoney: { type: Function, required: true },
  formatDate: { type: Function, required: true },
})
</script>

<style src="../theme/history.css"></style>
