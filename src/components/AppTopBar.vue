<template>
  <ion-header translucent class="topbar">
    <ion-toolbar class="topbar__toolbar">
      <!-- Menú -->
      <ion-buttons slot="start">
        <ion-menu-button class="topbar__btn" @click="onMenuButtonClick" />
      </ion-buttons>

      <!-- Título centrado -->
      <ion-title class="topbar__title">{{ title }}</ion-title>

      <!-- Usuario -->
      <ion-buttons slot="end">
        <ion-button class="topbar__btn" @click="toggleUserMenu">
          <ion-icon :icon="personCircleOutline" />
          <span class="topbar__user-label">{{ firstNameUpper }}</span>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <!-- Speed-dial + overlay -->
    <UserSpeedDial
      :open="menuOpen"
      @close="menuOpen=false"
      @edit="onEdit"
      @report="onReport"
      @logout="onLogout"
    />

    <!-- Toast error logout -->
    <ion-toast
      :is-open="logoutErrorOpen"
      message="No se pudo cerrar sesión. Intenta de nuevo."
      color="danger"
      duration="3000"
      @didDismiss="logoutErrorOpen=false"
    />
  </ion-header>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'   // ✅ importa hooks
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonButton, IonIcon, IonToast
} from '@ionic/vue'
import { personCircleOutline } from 'ionicons/icons'
import UserSpeedDial from './UserSpeedDial.vue'
import { useTopBarMenu } from '@/composables/useTopBarMenu'

const props = defineProps({
  title: { type: String, default: 'INGRESOS' },
  fullName: { type: String, default: '' },
  logoutFn: { type: Function, default: null }
})
const emit = defineEmits(['edit', 'report', 'logout'])

const {
  menuOpen,
  logoutErrorOpen,
  toggleUserMenu,
  onMenuButtonClick,
  handleLogout,
  wireGlobalEvents,
  unwireGlobalEvents
} = useTopBarMenu(props)

const firstNameUpper = computed(() => {
  const raw = (props.fullName || '').trim()
  const first = raw ? (raw.split(/\s+/)[0] || 'USUARIO') : 'USUARIO'
  return first.toUpperCase()
})

function onEdit ()  { menuOpen.value = false; emit('edit') }
function onReport(){ menuOpen.value = false; emit('report') }
async function onLogout(){
  menuOpen.value = false
  await handleLogout(() => emit('logout'))
}

// ✅ registra/limpia eventos globales correctamente
onMounted(() => { wireGlobalEvents() })
onUnmounted(() => { unwireGlobalEvents() })
</script>

<style src="../theme/topbar.css"></style>
