<template>
  <ion-page class="auth-email">
    <ion-header translucent>
      <ion-toolbar class="auth-email__toolbar">
        <ion-title class="auth-page__title">Registro</ion-title>
    </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="auth-email__content">
      <section class="auth-email__wrapper">
       <!--  <ion-button
          class="auth-email__back"
          fill="clear"
          size="large"
          @click="goBack"
        >
          <ion-icon :icon="backIcon" class="auth-email__back-icon" />
        </ion-button> -->
        <app-account />
        <ion-button
          class="auth-email__link"
          fill="clear"
          size="small"
          @click="goToLogin"
        >
          Ya tienes cuenta? Inicia sesion
        </ion-button>
      </section>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue'
import { chevronBackOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'
import AppAccount from '../components/AppAccount.vue'
import '@/theme/AuthPage.css'

const router = useRouter()
const backIcon = chevronBackOutline

const goBack = () => {
  router.back()
}

const goToLogin = () => {
  router.push({ name: 'Login' })
}
</script>
