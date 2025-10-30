<template>
  <transition name="banner-slide">
    <div v-show="banner.open" class="notif-banner" :data-color="banner.color" role="status" aria-live="polite">
      <div class="notif-banner__bar" />
      <div class="notif-banner__content">
        <div class="notif-banner__title">{{ banner.title }}</div>
        <div v-if="banner.body" class="notif-banner__body">{{ banner.body }}</div>
      </div>
      <button class="notif-banner__close" @click="hideBanner" aria-label="Cerrar">×</button>
    </div>
  </transition>
</template>

<script setup>
import { banner, hideBanner } from '@/stores/notify'
</script>

<style scoped>
.notif-banner{
  position: fixed;
  top: env(safe-area-inset-top, 0);
  left: 0;
  right: 0;
  z-index: 9999;
  display: grid;
  grid-template-columns: 8px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #ffffff;
  color: #0d3f48;
  box-shadow: 0 16px 32px -24px rgba(13, 63, 72, 0.5);
  border-bottom: 1px solid rgba(13, 63, 72, 0.08);
}

.notif-banner__bar{ width: 8px; height: 100%; border-radius: 0 8px 8px 0; background: var(--ion-color-tertiary); }
.notif-banner[data-color="success"] .notif-banner__bar{ background: var(--ion-color-success); }
.notif-banner[data-color="warning"] .notif-banner__bar{ background: var(--ion-color-warning); }
.notif-banner[data-color="danger"]  .notif-banner__bar{ background: var(--ion-color-danger); }
.notif-banner[data-color="primary"] .notif-banner__bar{ background: var(--ion-color-primary); }
.notif-banner[data-color="tertiary"] .notif-banner__bar{ background: var(--ion-color-tertiary); }

.notif-banner__content{ display: grid; gap: 4px; }
.notif-banner__title{ font-weight: 800; letter-spacing: 0.02em; }
.notif-banner__body{ color: #334155; font-weight: 600; font-size: 0.92rem; }

.notif-banner__close{ appearance: none; border: 0; background: transparent; color: #0d3f48; font-size: 18px; line-height: 1; padding: 6px 8px; border-radius: 8px; }
.notif-banner__close:active{ transform: scale(0.96); }

.banner-slide-enter-active,
.banner-slide-leave-active{ transition: transform 200ms ease, opacity 200ms ease; }
.banner-slide-enter-from,
.banner-slide-leave-to{ transform: translateY(-100%); opacity: 0; }
</style>

