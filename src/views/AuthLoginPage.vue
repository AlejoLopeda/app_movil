<template>
  <ion-page class="auth-login">
    <ion-header translucent>
      <ion-toolbar class="auth-login__toolbar">
        <ion-title class="auth-login__title">Iniciar sesion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="auth-login__content">
      <section class="auth-login__wrapper">
<!--         <ion-button
          class="auth-login__back"
          fill="clear"
          size="large"
          @click="goBack"
        >
          <ion-icon :icon="backIcon" class="auth-login__back-icon" />
        </ion-button> -->

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
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue'
import { chevronBackOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'
import AppLogin from '@/components/AppLogin.vue'
import { useAuth } from '@/composables/useAuth.js'

const router = useRouter()
const { isAuthenticated, restoreSession } = useAuth()

const backIcon = chevronBackOutline

const goBack = () => {
  router.back()
}

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

<style scoped>
.auth-login {
  --background: #f7f9fc;
}

.auth-login__toolbar {
  --background: #0d3f48;
  --color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.auth-login__title {
  display: block;
  text-align: center;
  color: #ffffff;
  font-weight: 800;
}

.auth-login__content {
  --background: #f7f9fc;
}

.auth-login__wrapper {
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
  gap: 1rem;
}

.auth-login__back {
  align-self: flex-start;
  margin-bottom: 1rem;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
}

.auth-login__back-icon {
  font-size: 2.4rem;
  color: #0d0d0d;
}

.auth-login__link {
  color: #0d3f48;
  font-weight: 600;
  align-self: center;
}
</style>
