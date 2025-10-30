<template>
  <div v-show="isMainRoute" class="bottom-fixed">
    <ion-toolbar class="bottombar">
      <!-- CTA mode: Add/Edit screens -->
      <div v-if="isAddPage" class="nav-cta">
        <button class="cta-btn" @click="goDashboard">
          <ion-icon :icon="chevronBackOutline" />
        </button>
        <button class="cta-btn" @click="emitAccept">
          <ion-icon :icon="checkmarkOutline" />
          <span>ACEPTAR</span>
        </button>
      </div>

      <!-- Perfil: volver + actualizar (deshabilitado si no hay cambios) -->
      <div v-else-if="isProfilePage" class="nav-cta">
        <button class="cta-btn" @click="goDashboard">
          <ion-icon :icon="chevronBackOutline" />
        </button>
        <button class="cta-btn" :disabled="!canSaveEnabled" @click="emitAccept">
          <ion-icon :icon="checkmarkOutline" />
          <span>ACTUALIZAR</span>
        </button>
      </div>

      <!-- Reminders panel: back + create -->
      <div v-else-if="isRemindersPage" class="nav-cta">
        <button class="cta-btn" @click="goDashboard">
          <ion-icon :icon="chevronBackOutline" />
        </button>
        <button class="cta-btn" @click="goAddReminder">
          <ion-icon :icon="add" />
          <span>CREAR</span>
        </button>
      </div>

      <!-- History mode: back + tabs -->
      <div v-else-if="isHistoryPage" class="nav-history">
        <button class="cta-btn" @click="goDashboard">
          <ion-icon :icon="chevronBackOutline" />
        </button>
        <button class="cta-btn" :class="{ active: historyTab==='income' }" @click="setHistoryTab('income')">
          <ion-icon :icon="cashOutline" />
          <span>INGRESO</span>
        </button>
        <button class="cta-btn" :class="{ active: historyTab==='expense' }" @click="setHistoryTab('expense')">
          <ion-icon :icon="cardOutline" />
          <span>GASTO</span>
        </button>
        <button class="cta-btn" :class="{ active: historyTab==='both' }" @click="setHistoryTab('both')">
          <ion-icon :icon="swapHorizontalOutline" />
        </button>
      </div>

      <!-- Normal mode -->
      <nav v-else class="nav nav--cta">
        <button class="nav-btn" :class="{ active: activeTab==='ingresos' }" @click="go('/ingresos')">
          <ion-icon :icon="cashOutline" />
          <span>INGRESO</span>
        </button>
        <button class="nav-btn" :class="{ active: activeTab==='gastos' }" @click="go('/gastos')">
          <ion-icon :icon="cardOutline" />
          <span>GASTO</span>
        </button>
        <button class="nav-btn" :class="{ active: activeTab==='historico' }" @click="goHistory">
          <ion-icon :icon="timeOutline" />
          <span>HISTORIAL</span>
        </button>
      </nav>
    </ion-toolbar>

    <ion-toast :is-open="toastOpen" :message="toastMsg" :duration="2200" color="danger" @didDismiss="toastOpen=false" />
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
  isMainRoute, isAddPage, isProfilePage, isRemindersPage, isHistoryPage,
  historyTab, activeTab, canSaveEnabled,
  go, goDashboard, goAddReminder, goHistory, setHistoryTab, emitAccept,
  toastOpen, toastMsg,
} = useBottomBar()
</script>

<style src="../theme/BottomBar.css"></style>
