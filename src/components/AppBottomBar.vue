<template>
  <div v-show="isMainRoute" class="bottom-fixed">
    <ion-toolbar class="bottombar" :class="{ 'is-busy': isNavigating }">
      <!-- CTA: crear/editar -->
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

      <!-- Perfil -->
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

      <!-- Recordatorios -->
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

      <!-- HISTÓRICO (LISTAS): Back /balance + Ingreso + Gasto + Ambos (icon-only) -->
      <nav v-else-if="isHistoryListPage" class="nav nav--history">
        <!-- Back a /balance -->
        <button
          type="button"
          class="nav-btn icon-only"
          @click="goBalance"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
          aria-label="Volver a Balance"
        >
          <ion-icon :icon="chevronBackOutline" />
        </button>

        <!-- Ingreso -->
        <button
          type="button"
          class="nav-btn"
          :class="[{ active: historyTab==='income' }, { 'is-locked': isNavigating }]"
          @click="setHistoryTab('income')"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="cashOutline" />
          <span>INGRESO</span>
        </button>

        <!-- Gasto -->
        <button
          type="button"
          class="nav-btn"
          :class="[{ active: historyTab==='expense' }, { 'is-locked': isNavigating }]"
          @click="setHistoryTab('expense')"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="cardOutline" />
          <span>GASTO</span>
        </button>

        <!-- Ambos (icon-only) -->
        <button
          type="button"
          class="nav-btn icon-only"
          :class="[{ active: historyTab==='both' }, { 'is-locked': isNavigating }]"
          @click="setHistoryTab('both')"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
          aria-label="Ver ambos"
        >
          <ion-icon :icon="swapHorizontalOutline" />
        </button>
      </nav>

      <!-- BALANCE (/balance) + INGRESOS + GASTOS: misma nav + toggle -->
      <nav v-else-if="isMonthlyArea" class="nav nav--cta">
        <button
          type="button"
          class="nav-btn"
          :class="[{ active: activeTab==='ingresos' }, { 'is-locked': isNavigating }]"
          @click="goOrToggleIncome"
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
          @click="goOrToggleExpense"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="cardOutline" />
          <span>GASTO</span>
        </button>

        <button
          type="button"
          class="nav-btn"
          :class="[{ active: isHistoryListPage }, { 'is-locked': isNavigating }]"
          @click="goHistory"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
        >
          <ion-icon :icon="timeOutline" />
          <span>HISTORIAL</span>
        </button>
      </nav>

      <!-- Modo normal -->
      <nav v-else class="nav nav--cta">
        <button
          type="button"
          class="nav-btn"
          :class="[{ active: activeTab==='ingresos' }, { 'is-locked': isNavigating }]"
          @click="goOrToggleIncome"
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
          @click="goOrToggleExpense"
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
  chevronBackOutline, checkmarkOutline, swapHorizontalOutline, add
} from 'ionicons/icons'
import { useBottomBar } from '@/composables/useBottomBar'

const {
  isMainRoute, isAddPage, isProfilePage, isRemindersPage,
  isHistoryListPage, isMonthlyBothPage, isMonthlyArea,
  historyTab, activeTab, canSaveEnabled,
  go, goDashboard, goAddReminder, goHistory, setHistoryTab, emitAccept,
  goMonthlyIncome, goMonthlyExpense, goMonthlyBoth, goBalance,
  goOrToggleIncome, goOrToggleExpense,
  toastOpen, toastMsg, isNavigating,
} = useBottomBar()
</script>

<style scoped>
/* Histórico: compactar icon-only */
.nav--history .nav-btn.icon-only{
  min-width: 48px;
  width: 48px;
  padding: 0;
  justify-content: center;
}
</style>

<style src="../theme/BottomBar.css"></style>
