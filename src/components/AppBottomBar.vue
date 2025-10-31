<template>
  <div v-show="isMainRoute" class="bottom-fixed">
    <ion-toolbar class="bottombar" :class="{ 'is-busy': isNavigating }">
      <!-- CTA mode: Add/Edit screens -->
      <div v-if="isAddPage" class="nav-cta">
        <button
          type="button"
          class="cta-btn"
          @click="goDashboard"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
          :class="{ 'is-locked': isNavigating }"
        >
          <ion-icon :icon="chevronBackOutline" />
        </button>

        <button
          type="button"
          class="cta-btn"
          @click="emitAccept"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
          :class="{ 'is-locked': isNavigating }"
        >
          <ion-icon :icon="checkmarkOutline" />
          <span>ACEPTAR</span>
        </button>
      </div>

      <!-- Perfil: volver + actualizar -->
      <div v-else-if="isProfilePage" class="nav-cta">
        <button
          type="button"
          class="cta-btn"
          @click="goDashboard"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
          :class="{ 'is-locked': isNavigating }"
        >
          <ion-icon :icon="chevronBackOutline" />
        </button>

        <!-- Mantener disabled real solo por canSaveEnabled; si es por navegación, no aclarar -->
        <button
          type="button"
          class="cta-btn"
          :disabled="!canSaveEnabled"
          @click="emitAccept"
          :data-busy="isNavigating"
          :class="{ 'is-locked': isNavigating }"
          :aria-disabled="!canSaveEnabled || isNavigating"
        >
          <ion-icon :icon="checkmarkOutline" />
          <span>ACTUALIZAR</span>
        </button>
      </div>

      <!-- Reminders panel -->
      <div v-else-if="isRemindersPage" class="nav-cta">
        <button
          type="button"
          class="cta-btn"
          @click="goDashboard"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
          :class="{ 'is-locked': isNavigating }"
        >
          <ion-icon :icon="chevronBackOutline" />
        </button>
        <button
          type="button"
          class="cta-btn"
          @click="goAddReminder"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
          :class="{ 'is-locked': isNavigating }"
        >
          <ion-icon :icon="add" />
          <span>CREAR</span>
        </button>
      </div>

      <!-- Historial: ingreso, gasto, ambos + botón de BALANCE (ambos) -->
      <div v-else-if="isHistoryListPage" class="nav-history">
        <button
          type="button"
          class="cta-btn"
          :class="[{ active: historyTab==='income' }, { 'is-locked': isNavigating }]"
          @click="setHistoryTab('income')"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="cashOutline" />
          <span>INGRESO</span>
        </button>

        <button
          type="button"
          class="cta-btn"
          :class="[{ active: historyTab==='expense' }, { 'is-locked': isNavigating }]"
          @click="setHistoryTab('expense')"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="cardOutline" />
          <span>GASTO</span>
        </button>

        <button
          type="button"
          class="cta-btn"
          :class="[{ active: historyTab==='both' }, { 'is-locked': isNavigating }]"
          @click="setHistoryTab('both')"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="swapHorizontalOutline" />
          <span>AMBOS</span>
        </button>

        <button
          type="button"
          class="cta-btn"
          @click="goMonthlyBoth"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="statsChartOutline" />
          <span>BALANCE</span>
        </button>
      </div>

      <!-- Balance views (ingreso, gasto, ambos) + historial (ambos) -->
      <div v-else-if="isMonthlyArea" class="nav-history">
        <button
          type="button"
          class="cta-btn"
          :class="[{ active: activeTab==='ingresos' }, { 'is-locked': isNavigating }]"
          @click="goMonthlyIncome"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="cashOutline" />
          <span>INGRESO</span>
        </button>

        <button
          type="button"
          class="cta-btn"
          :class="[{ active: activeTab==='gastos' }, { 'is-locked': isNavigating }]"
          @click="goMonthlyExpense"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="cardOutline" />
          <span>GASTO</span>
        </button>

        <button
          type="button"
          class="cta-btn"
          :class="[{ active: isMonthlyBothPage }, { 'is-locked': isNavigating }]"
          @click="goMonthlyBoth"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="swapHorizontalOutline" />
          <span>AMBOS</span>
        </button>

        <button
          type="button"
          class="cta-btn"
          :class="[{ active: isHistoryListPage }, { 'is-locked': isNavigating }]"
          @click="goHistory"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="timeOutline" />
          <span>HISTORIAL</span>
        </button>
      </div>

      <!-- Normal mode -->
      <nav v-else class="nav nav--cta">
        <button
          type="button"
          class="nav-btn"
          :class="[{ active: activeTab==='ingresos' }, { 'is-locked': isNavigating }]"
          @click="go('/ingresos')"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="cashOutline" />
          <span>INGRESO</span>
        </button>

        <button
          type="button"
          class="nav-btn"
          :class="[{ active: activeTab==='gastos' }, { 'is-locked': isNavigating }]"
          @click="go('/gastos')"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="cardOutline" />
          <span>GASTO</span>
        </button>

        <button
          type="button"
          class="nav-btn"
          :class="[{ active: activeTab==='historico' }, { 'is-locked': isNavigating }]"
          @click="goHistory"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="timeOutline" />
          <span>HISTORIAL</span>
        </button>
      </nav>
    </ion-toolbar>

    <ion-toast
      :is-open="toastOpen"
      :message="toastMsg"
      :duration="2200"
      color="danger"
      @didDismiss="toastOpen=false"
    />
  </div>
</template>

<script setup>
import { IonToolbar, IonIcon, IonToast } from '@ionic/vue'
import {
  cashOutline, cardOutline, timeOutline,
  chevronBackOutline, checkmarkOutline, swapHorizontalOutline, add,
  statsChartOutline,
} from 'ionicons/icons'
import { useBottomBar } from '@/composables/useBottomBar'

const {
  isMainRoute, isAddPage, isProfilePage, isRemindersPage, isHistoryPage,
  historyTab, activeTab, canSaveEnabled,
  isHistoryListPage, isMonthlyBothPage, isMonthlyArea,
  go, goDashboard, goAddReminder, goHistory, setHistoryTab, emitAccept,
  goMonthlyIncome, goMonthlyExpense, goMonthlyBoth,
  toastOpen, toastMsg,
  isNavigating,
} = useBottomBar()
</script>

<style src="../theme/BottomBar.css"></style>
