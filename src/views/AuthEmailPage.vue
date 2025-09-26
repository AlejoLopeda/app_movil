<template>
  <ion-page class="auth-email">
    <ion-header translucent>
      <ion-toolbar class="auth-email__toolbar">
        <ion-title style="display:block; text-align:center; color:#fff; font-weight: 800;" >Registro</ion-title>
    </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="auth-email__content">
      <section class="auth-email__wrapper">
        <ion-button
          class="auth-email__back"
          fill="clear"
          size="large"
          @click="goBack"
        >
          <ion-icon :icon="backIcon" class="auth-email__back-icon" />
        </ion-button>
        <app-account />
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

const router = useRouter()
const backIcon = chevronBackOutline

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.auth-email {
  --background: #f7f9fc;
}

.auth-email__toolbar {
  --background: #0d3f48;
  --color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.auth-email__content {
  --background: #f7f9fc;
}

.auth-email__wrapper {
  position: relative;
  min-height: 100%;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem;
  box-sizing: border-box;
}

.auth-email__back {
  align-self: flex-start;
  margin-bottom: 1.5rem;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
}

.auth-email__back-icon {
  font-size: 2.4rem;
  color: #0d0d0d;
}
</style>
