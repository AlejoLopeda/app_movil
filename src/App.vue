<template>
  <ion-app class="has-global-bottom-bar">
    <SideMenu />
    <ion-router-outlet id="main-content" />
    <AppBottomBar />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import SideMenu from '@/components/SideMenu.vue'
import AppBottomBar from '@/components/AppBottomBar.vue'
</script>

<style>
.has-global-bottom-bar{
  --bottom-bar-height: 76px;
  /* offset reutilizable para levantar CTAs, fabs, etc. */
  --bottom-bar-offset: calc(var(--bottom-bar-height) + env(safe-area-inset-bottom));
}

/* Reserva espacio para TODO ion-content */
.has-global-bottom-bar ion-content{
  --padding-bottom: var(--bottom-bar-offset);
}
</style>