<template>
  <ion-page class="auth-login" mode="ios">
    <ion-header class="auth-topbar">
      <div class="auth-topbar__notch" aria-hidden="true"></div>
      <ion-toolbar class="auth-topbar__toolbar">
        <ion-title class="auth-topbar__title">Iniciar sesion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="auth-login__content" mode="ios">
      <section class="auth-login__wrapper">

        <app-login @success="handleSuccess" />

        <ion-button
          class="auth-login__link"
          fill="clear"
          size="small"
          @click="goToRegister"
        >
          No tienes cuenta? Crear una nueva
        </ion-button>
      </section>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue'
import { useRouter } from 'vue-router'
import AppLogin from '@/components/AppLogin.vue'
import '@/theme/AuthPage.css'
import { useAuth } from '@/composables/useAuth.js'

const router = useRouter()
const { isAuthenticated, restoreSession } = useAuth()

const goToRegister = () => {
  router.push({ name: 'Register' })
}

const redirectToApp = () => {
  const target = router.currentRoute.value?.query?.redirect
  if (typeof target === 'string' && target) {
    router.replace(target)
    return
  }

  if (router.currentRoute.value?.name !== 'Monto') {
    router.replace({ name: 'Monto' })
  }
}

const handleSuccess = () => {
  redirectToApp()
}

onMounted(async () => {
  await restoreSession()
  if (isAuthenticated.value) {
    redirectToApp()
  }
})

watch(isAuthenticated, (value) => {
  if (value) {
    redirectToApp()
  }
})
</script>
