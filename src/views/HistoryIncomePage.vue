<template>
  <ion-page class="history-page">
    <app-top-bar :title="'HISTÓRICO — INGRESOS'" />

    <ion-content class="history-content" fullscreen>
      <history-filters
        :from="from" :to="to"
        :date-open="dateOpen" :cat-open="catOpen"
        :date-error="dateError"
        :date-label="dateLabel"
        :categories-label="categoriesLabel"
        :chips="chips"
        :visible-categories="visibleCategories"
        :selected-cats="selectedCats"
        :all-cats-selected="allCatsSelected"
        :icon-for="iconFor"
        @open-date="openDateModal"
        @open-cat="openCatModal"
        @close-date="dateOpen=false"
        @close-cat="catOpen=false"
        @update:from="v=>from=v"
        @update:to="v=>to=v"
        @clear-dates="clearDates"
        @apply-dates="applyDates"
        @toggle-all="toggleAllCats"
        @reset-cats="resetCats"
        @toggle-cat="toggleCat"
        @apply-cats="applyCats"
      />

      <history-list
        :items="items"
        :loading="loading"
        :error="error"
        :empty-message="emptyMessage"
        :formatMoney="formatMoney"
        :formatDate="formatDate"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent } from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import HistoryFilters from '@/components/HistoryFilters.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useHistory } from '@/composables/useHistory'

// 👉 tab fijo en 'income'
const {
  from, to, selectedCats, items, loading, error,
  dateOpen, catOpen, dateError, visibleCategories, allCatsSelected,
  dateLabel, categoriesLabel, chips, emptyMessage,
  formatMoney, formatDate, iconFor,
  openDateModal, openCatModal, clearDates, applyDates,
  toggleAllCats, resetCats, toggleCat, applyCats,
} = useHistory({ fixedTab: 'income' })
</script>
