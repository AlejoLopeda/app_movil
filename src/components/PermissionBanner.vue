<template>
  <transition name="banner-slide">
    <div v-show="open" class="notif-banner notif-banner--perm" role="status" aria-live="polite">
      <div class="notif-banner__bar" />
      <div class="notif-banner__content">
        <div class="notif-banner__title">Activa las notificaciones</div>
        <div class="notif-banner__body">Permite las notificaciones para recibir recordatorios aunque la app no esté abierta.</div>
      </div>
      <div class="notif-banner__actions">
        <button class="notif-banner__btn" @click="onAllow">Permitir</button>
        <button class="notif-banner__btn" @click="open=false">Ocultar</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { isNativeLN, checkPermission, ensurePermission } from '@/lib/localNotifications'

const open = ref(false)

async function refresh() {
  try {
    if (!isNativeLN()) { open.value = false; return }
    const { granted } = await checkPermission()
    open.value = !granted
  } catch { open.value = false }
}

async function onAllow() {
  try {
    const res = await ensurePermission()
    if (res?.granted) {
      open.value = false
      try { window.dispatchEvent(new CustomEvent('reminders:perm-granted')) } catch {}
    }
  } catch {}
}

onMounted(refresh)
</script>

<style scoped>
.notif-banner{ position: fixed; top: env(safe-area-inset-top, 0); left:0; right:0; z-index:9999; display:grid; grid-template-columns:8px 1fr auto; align-items:center; gap:12px; padding:12px 14px; background:#fff; color:#0d3f48; box-shadow:0 16px 32px -24px rgba(13,63,72,.5); border-bottom:1px solid rgba(13,63,72,.08); }
.notif-banner__bar{ width:8px; height:100%; border-radius:0 8px 8px 0; background: var(--ion-color-warning, #f59e0b); }
.notif-banner__content{ display:grid; gap:4px; }
.notif-banner__title{ font-weight:800; letter-spacing:.02em; }
.notif-banner__body{ color:#334155; font-weight:600; font-size:.92rem; }
.notif-banner__actions{ display:flex; gap:8px; }
.notif-banner__btn{ appearance:none; border:0; background: var(--ion-color-primary, #0d3f48); color:#fff; padding:6px 10px; border-radius:8px; font-weight:700; }
.banner-slide-enter-active,.banner-slide-leave-active{ transition: transform 200ms ease, opacity 200ms ease; }
.banner-slide-enter-from,.banner-slide-leave-to{ transform: translateY(-100%); opacity:0; }
</style>

