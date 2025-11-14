<template>
  <div v-show="isMainRoute" class="bottom-fixed" :class="{ 'report-active': isReportPage }">
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
          :disabled="isEditReminderPage && !canSaveEnabled"
          :aria-disabled="isNavigating || (isEditReminderPage && !canSaveEnabled)"
          :data-busy="isNavigating"
          :class="{ 'is-locked': isNavigating || (isEditReminderPage && !canSaveEnabled) }"
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

      <!-- Metas -->
      <div v-else-if="isGoalsPage" class="nav-cta">
        <button
          type="button"
          class="cta-btn"
          @click="isGoalCreatePage ? goGoalsPanel() : goDashboard()"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
          :class="{ 'is-locked': isNavigating }"
        >
          <ion-icon :icon="chevronBackOutline" />
        </button>

        <button
          type="button"
          class="cta-btn"
          @click="isGoalCreatePage ? emitAccept() : goAddGoal()"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
          :class="{ 'is-locked': isNavigating }"
        >
          <ion-icon :icon="add" />
          <span>CREAR</span>
        </button>
      </div>

      <!-- ✅ REPORTES (root): Regresar + PREVISUALIZAR -->
      <div v-else-if="isReportRootPage" class="nav-cta">
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
          @click="emitPreview"
          :data-busy="isNavigating"
          :class="{ 'is-locked': isNavigating }"
          :aria-disabled="isNavigating"
        >
          <ion-icon :icon="eyeOutline" />
          <span>PREVISUALIZAR</span>
        </button>
      </div>

      <!-- ✅ REPORTES (previsualización): Regresar + DESCARGAR -->
      <div v-else-if="isReportPreviewPage" class="nav-cta">
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
          :disabled="!canDownloadEnabled"
          @click="emitDownload"
          :data-busy="isNavigating"
          :class="{ 'is-locked': isNavigating }"
          :aria-disabled="!canDownloadEnabled || isNavigating"
        >
          <ion-icon :icon="downloadOutline" />
          <span>DESCARGAR</span>
        </button>
      </div>

      <!-- HISTÓRICO (LISTAS) -->
      <nav v-else-if="isHistoryListPage" class="nav nav--history">
        <button
          type="button"
          class="nav-btn icon-only"
          @click="goDashboard"
          :aria-disabled="isNavigating"
          :data-busy="isNavigating"
          aria-label="Volver a Balance"
        >
          <ion-icon :icon="chevronBackOutline" />
        </button>

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

      <!-- BALANCE (/balance) + INGRESOS + GASTOS -->
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
  chevronBackOutline, checkmarkOutline, swapHorizontalOutline, add,
  downloadOutline, eyeOutline
} from 'ionicons/icons'
import { useBottomBar } from '@/composables/useBottomBar'

const {
  isMainRoute, isAddPage, isProfilePage, isRemindersPage, isEditReminderPage,
  isReportPage, isReportRootPage, isReportPreviewPage,
  isHistoryListPage, isMonthlyArea, isGoalsPage, isGoalCreatePage,
  historyTab, activeTab, canSaveEnabled, canDownloadEnabled,
  goDashboard, goAddReminder, goHistory, setHistoryTab, emitAccept, emitDownload,
  goAddGoal, goGoalsPanel, emitPreview,
  goOrToggleIncome, goOrToggleExpense,
  toastOpen, toastMsg, isNavigating,
} = useBottomBar()
</script>

<style src="../theme/BottomBar.css"></style>
