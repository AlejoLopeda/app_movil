<template>
  <ion-header translucent class="topbar">
    <ion-toolbar class="topbar__toolbar">
      <!-- Menú -->
      <ion-buttons slot="start">
        <!-- 👇 Cierra el speed-dial al abrir el menú lateral -->
        <ion-menu-button class="topbar__btn" @click="onMenuButtonClick" />
      </ion-buttons>

      <!-- Título centrado -->
      <ion-title class="topbar__title">
        {{ title }}
      </ion-title>

      <!-- Usuario -->
      <ion-buttons slot="end">
        <ion-button class="topbar__btn" @click="toggleUserMenu">
          <ion-icon :icon="personCircleOutline" />
          <span class="topbar__user-label">{{ firstNameUpper }}</span>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <!-- ✅ Overlay para cerrar al tocar fuera (AÑADIDO) -->
    <div v-if="menuOpen" class="user-speed-overlay" @click="menuOpen=false"></div>

    <!-- Speed-dial de acciones de usuario -->
    <div v-if="menuOpen" class="user-speed" @click.self="menuOpen=false">
      <!-- Editar perfil -->
      <ion-button
        class="user-speed__btn"
        shape="round"
        fill="solid"
        @click="onEdit"
        aria-label="Editar perfil"
        title="Editar perfil"
      >
        <ion-icon :icon="createOutline" aria-hidden="true" />
      </ion-button>

      <!-- Generar reporte -->
      <ion-button
        class="user-speed__btn"
        shape="round"
        fill="solid"
        @click="onReport"
        aria-label="Generar reporte"
        title="Generar reporte (PDF)"
      >
        <ion-icon :icon="documentTextOutline" aria-hidden="true" />
      </ion-button>

      <!-- Cerrar sesión -->
      <ion-button
        class="user-speed__btn user-speed__btn--danger"
        color="danger"
        shape="round"
        fill="solid"
        @click="onLogout"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <ion-icon :icon="logOutOutline" aria-hidden="true" />
      </ion-button>
    </div>

    <!-- ✅ Toast de error al cerrar sesión -->
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonButton, IonIcon,
  IonToast,
  menuController
} from '@ionic/vue'
import { personCircleOutline, createOutline, documentTextOutline, logOutOutline } from 'ionicons/icons'

const props = defineProps({
  title: { type: String, default: 'INGRESOS' },
  fullName: { type: String, default: '' }, // ← pásame el full_name de Supabase
  // 👇 opcional: si la pasas, se usa para hacer logout con try/catch
  logoutFn: { type: Function, default: null }
})

const emit = defineEmits(['edit', 'report', 'logout'])

const firstName = computed(() => {
  const raw = (props.fullName || '').trim()
  if (!raw) return 'USUARIO'
  return raw.split(/\s+/)[0] || 'USUARIO'
})
const firstNameUpper = computed(() => firstName.value.toUpperCase())

const menuOpen = ref(false)
const logoutErrorOpen = ref(false)   // 👈 estado del toast

/** 👉 Abre/cierra el speed-dial. Si vas a abrirlo, cierra el menú lateral primero. */
const toggleUserMenu = async () => {
  if (!menuOpen.value) {
    await menuController.close() // cierra el ion-menu si estuviera abierto
    menuOpen.value = true
  } else {
    menuOpen.value = false
  }
}

/** ✅ Nuevo: manejar click del botón del menú lateral */
const onMenuButtonClick = async () => {
  // cierra el menú de usuario si estuviera abierto…
  if (menuOpen.value) menuOpen.value = false
  // …y abre el menú lateral de una vez
  await menuController.open('main-menu')
}

const onEdit = () => { menuOpen.value = false; emit('edit') }
const onReport = () => { menuOpen.value = false; emit('report') }

/** ✅ Logout con manejo de error:
 * - Si hay props.logoutFn (Promise), la usamos con try/catch y mostramos toast si falla.
 * - Si no, emitimos 'logout' y esperamos que el padre dispare 'logout-failed' en error.
 */
const onLogout = async () => {
  menuOpen.value = false
  if (typeof props.logoutFn === 'function') {
    try {
      await props.logoutFn()
    } catch (e) {
      logoutErrorOpen.value = true
    }
  } else {
    emit('logout')
  }
}

/** 👉 Cierra el speed-dial si el menú lateral se va a abrir (swipe/click). */
const closeUserSpeed = () => { menuOpen.value = false }
/** 👉 Si el padre avisa que falló el logout, muestra el toast. */
const handleLogoutFailed = () => { logoutErrorOpen.value = true }

onMounted(() => {
  window.addEventListener('close-user-speed', closeUserSpeed)
  window.addEventListener('logout-failed', handleLogoutFailed)
})
onUnmounted(() => {
  window.removeEventListener('close-user-speed', closeUserSpeed)
  window.removeEventListener('logout-failed', handleLogoutFailed)
})
</script>

<style scoped>
.topbar__toolbar {
  --background: var(--app-topbar-bg, #0d3f48);
  --color: #ffffff;
  --border-width: 0;
  min-height: 56px;
}
.topbar__btn { --color: #ffffff; }
.topbar__title {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 800;
  text-align: center;
}

/* Siempre visible */
.topbar__user-label {
  margin-left: .25rem;
  font-size: .75rem;
  font-weight: 700;
  display: inline;
  white-space: nowrap;
}

/* Speed-dial flotante */
.user-speed {
  position: fixed;
  z-index: 9999;
  top: calc(env(safe-area-inset-top) + 60px);
  right: 12px;
  display: grid;
  gap: 10px;
}

.user-speed__btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  --border-radius: 50%;
  --box-shadow: 0 6px 18px rgba(0,0,0,.18);
  --color: #fff;                 /* icono blanco */
  --background: var(--app-topbar-bg, #0d3f48); /* 👈 mismo color de navbar */
  --padding-start: 0;
  --padding-end: 0;
  display: grid;
  place-items: center;
}

/* Botón rojo (cerrar sesión) */
.user-speed__btn--danger {
  --background: #e53935; /* rojo danger */
  --color: #fff;
}

/* Tamaño visible del icono */
.user-speed__btn ion-icon {
  font-size: 22px;
  width: 22px;
  height: 22px;
  color: #fff;
}

/* ✅ Overlay a pantalla completa (AÑADIDO) */
.user-speed-overlay {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 56px); /* no cubre el botón del menú */
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;            /* justo debajo del .user-speed (9999) */
  background: rgba(0,0,0,0);/* si en iOS no capta, usa 0.001 */
  /* background: rgba(0,0,0,0.001); */
  pointer-events: auto;
  top: calc(var(--ion-safe-area-top) + 56px);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .topbar__toolbar {
    --background: var(--app-topbar-bg-dark, #0b2e35);
    --color: #e6f1f3;
    padding-top: var(--ion-safe-area-top);
    min-height: calc(56px + var(--ion-safe-area-top));
  }
  .topbar__btn { --color: #e6f1f3; }

  /* En modo oscuro los botones heredan el color oscuro de navbar */
  .user-speed__btn {
    --background: var(--app-topbar-bg-dark, #0b2e35);
    --color: #fff;
    top: calc(var(--ion-safe-area-top) + 60px);
  }
  .user-speed__btn--danger {
    --background: #e53935;
    --color: #fff;
  }
}
</style>