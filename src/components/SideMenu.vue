<template>
  <!-- ===== Menú lateral ===== -->
  <ion-menu
    menu-id="main-menu"
    content-id="main-content"
    class="side-menu"
    :swipe-gesture="true"
    @ionWillOpen="onSideMenuWillOpen"
  >
    <!-- Barra superior (negra + blur) para el área del status bar -->
    <div class="side-menu__notch" aria-hidden="true"></div>

    <!-- Contenedor interno (fondo translúcido y borroso) -->
    <div class="side-menu__inner">
      <ion-header>
        <ion-toolbar class="side-menu__toolbar">
          <ion-title class="side-menu__title">Menú</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content class="side-menu__content" :force-overscroll="false">
        <ion-list class="side-menu__list">
          <ion-menu-toggle v-for="it in menuItems" :key="it.path" auto-hide="true">
            <ion-item
              button
              detail="false"
              class="side-menu__item"
              @click="goTo(it.path)"
            >
              {{ it.label }}
            </ion-item>
          </ion-menu-toggle>
        </ion-list>
      </ion-content>
    </div>
  </ion-menu>

  <!-- ===== Toasts de validación ===== -->
  <ion-toast
    :is-open="openMenuError"
    message="No se pudo abrir el menú. Intenta de nuevo."
    color="danger"
    duration="2500"
    @didDismiss="openMenuError=false"
  />
  <ion-toast
    :is-open="optionsError"
    message="No se pudieron cargar todas las opciones. Intenta nuevamente."
    color="warning"
    duration="2500"
    @didDismiss="optionsError=false"
  />
  <ion-toast
    :is-open="sectionError"
    message="No se pudo abrir esta sección. Intenta de nuevo."
    color="danger"
    duration="2500"
    @didDismiss="sectionError=false"
  />
</template>

<script setup>
import {
  IonMenu, IonHeader, IonToolbar, IonTitle,
  IonContent, IonList, IonItem, IonMenuToggle, IonToast
} from '@ionic/vue'
import { useSideMenu } from '@/composables/useSideMenu'

// extrae todo desde el composable
const {
  menuItems,
  openMenuError,
  optionsError,
  sectionError,
  onSideMenuWillOpen,
  goTo,
} = useSideMenu()
</script>

<!-- Estilos propios del menú lateral (globales) -->
<style src="@/theme/sideMenu.css"></style>
