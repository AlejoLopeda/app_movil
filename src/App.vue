<template>
  <ion-app>
    <!-- Menú lateral desacoplado -->
    <SideMenu />

    <!-- Contenedor principal (id coincide con el content-id del menú) -->
    <ion-router-outlet id="main-content" />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import SideMenu from '@/components/SideMenu.vue'
</script>
