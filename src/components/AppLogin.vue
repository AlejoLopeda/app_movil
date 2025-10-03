<template>
  <section class="app-login">
    <ion-card class="app-login__card" mode="ios">
      <ion-card-content>
        <form @submit.prevent="onSubmit" class="app-login__form">
          <h2 class="app-login__title">BIENVENIDO</h2>

          <ion-list class="app-login__list" inset lines="none">
            <ion-item class="app-login__item auth-field-item" lines="none">
              <ion-icon slot="start" :icon="mailIcon" class="app-login__item-icon" />
              <ion-input
                v-model="form.email"
                autocomplete="email"
                inputmode="email"
                placeholder="Correo electronico"
                type="email"
                required
                class="app-login__input"
              />
            </ion-item>

            <ion-item class="app-login__item auth-field-item" lines="none">
              <ion-icon slot="start" :icon="lockIcon" class="app-login__item-icon" />
              <ion-input
                v-model="form.password"
                autocomplete="current-password"
                placeholder="Contrasena"
                type="password"
                minlength="6"
                required
                class="app-login__input"
              />
            </ion-item>
          </ion-list>

          <ion-text v-if="errorMessage" color="danger" class="app-login__feedback">
            {{ errorMessage }}
          </ion-text>

          <ion-button
            class="app-login__submit"
            type="submit"
            expand="block"
            shape="round"
            :disabled="isLoading"
          >
            <template v-if="isLoading">
              <ion-spinner name="crescent" class="app-login__spinner" />
              Iniciando sesion...
            </template>
            <template v-else>
              Iniciar sesion
            </template>
          </ion-button>
        </form>
      </ion-card-content>
    </ion-card>
  </section>
</template>

<script setup>
import { computed, reactive, onMounted } from 'vue'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonSpinner,
  IonText
} from '@ionic/vue'
import { mailOutline, lockClosedOutline } from 'ionicons/icons'
import '@/theme/AuthPage.css'
import { useAuth } from '../composables/useAuth.js'

const emit = defineEmits(['success'])

const form = reactive({
  email: '',
  password: ''
})

const mailIcon = mailOutline
const lockIcon = lockClosedOutline

const { login, isLoading, authError } = useAuth()

const errorMessage = computed(() => authError.value)

onMounted(() => {
  authError.value = null
})

const onSubmit = async () => {
  const { error, data } = await login({ ...form })
  if (!error) {
    form.email = ''
    form.password = ''
    emit('success', data)
  }
}
</script>
