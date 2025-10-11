<template>
  <ion-page class="expense-page">
    <!-- ✅ NUEVO: misma topbar reutilizable que en Dashboard -->
    <app-top-bar :title="pageTitle" />

    <!-- (tu header original queda intacto pero oculto) -->
    <ion-header class="expense-header" translucent v-if="false">
      <ion-toolbar class="expense-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="expense-menu" />
        </ion-buttons>
        <ion-title class="expense-toolbar__title">Gastos</ion-title>
        <ion-buttons slot="end">
          <ion-button class="expense-profile" @click="goPerfil">
            <ion-icon :icon="personCircleOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- ✅ NUEVO: padding-top para no quedar debajo de la topbar -->
    <ion-content
      class="expense-content ion-padding"
      fullscreen
      style="--padding-top: var(--ion-safe-area-top);"
    >
      <section class="expense-section">
        <header class="expense-hero">
          <span class="expense-badge">Nuevo registro</span>
          <h2 class="expense-heading">Anadir gasto</h2>
          <p class="expense-copy">
            Registra los gastos que realizas para mantener tu control financiero al dia.
          </p>
        </header>

        <ExpenseForm class="expense-form" :loading="loading" @submit="handleSubmit" />
      </section>

      <ion-toast
        class="expense-toast"
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
// ✅ NUEVO: imports para usar la topbar y el título desde meta
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppTopBar from '@/components/AppTopBar.vue'

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonToast,
  IonButton,
  IonIcon,
} from '@ionic/vue'
import { personCircleOutline } from 'ionicons/icons'
import { useAddExpense } from '@/composables/useAddExpense'
import ExpenseForm from '@/components/ExpenseForm.vue'
import { getCurrentUserId } from '@/services/expenseService'
import '@/theme/ExpensePage.css'

// ✅ NUEVO: título tomado de meta.title o fallback "GASTOS"
const route = useRoute()
const pageTitle = computed(() => route.meta?.title || 'GASTOS')

const { loading, saveExpense } = useAddExpense()

const toast = ref({ open: false, message: '', color: 'primary' })
function showToast(message, color = 'primary') {
  toast.value = { open: true, message, color }
}

async function handleSubmit(payload) {
  const res = await saveExpense(payload)
  if (res.ok) {
    showToast('Gasto guardado', 'success')
    return
  }
  const userId = await getCurrentUserId()
  console.error('[Guardar gasto][error]', { userId, timestamp: new Date().toISOString(), error: res })
  if (res.reason === 'unauthorized') showToast('No autorizado. Inicia sesion e intentalo de nuevo', 'danger')
  else if (res.reason === 'rls') showToast('Tu usuario no tiene permiso para guardar en gastos', 'danger')
  else showToast('No se pudo guardar el gasto. Intenta de nuevo', 'danger')
}

function goPerfil() {
  showToast('Pantalla de perfil no disponible', 'medium')
}
</script>
