<template>
  <ion-app>
    <!-- 👇 Menú lateral -->
    <ion-menu menu-id="main-menu" content-id="main-content" @ionWillOpen="onSideMenuWillOpen">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Menú</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <ion-list>
          <ion-menu-toggle auto-hide="true">
            <ion-item button router-link="/dashboard">Dashboard</ion-item>
          </ion-menu-toggle>

          <ion-menu-toggle auto-hide="true">
            <ion-item button router-link="/monto">Monto inicial</ion-item>
          </ion-menu-toggle>

          <ion-menu-toggle auto-hide="true">
            <ion-item button router-link="/ingresos/nuevo">Anadir ingreso</ion-item>
          </ion-menu-toggle>

          <ion-menu-toggle auto-hide="true">
            <ion-item button router-link="/gastos/nuevo">Anadir gasto</ion-item>
          </ion-menu-toggle>
        </ion-list>
      </ion-content>
    </ion-menu>

    <!-- 👇 Contenedor principal (id debe coincidir con content-id del menú) -->
    <ion-router-outlet id="main-content" />
  </ion-app>
</template>

<script setup>
import {
  IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle,
  IonContent, IonList, IonItem, IonMenuToggle
} from '@ionic/vue'

/** 👇 se dispara cada vez que se va a abrir el menú lateral */
const onSideMenuWillOpen = () => {
  window.dispatchEvent(new CustomEvent('close-user-speed'))
}
</script>
