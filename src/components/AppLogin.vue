<template>
  <section class="app-login">
    <ion-card class="app-login__card" mode="ios">
      <ion-card-content>
        <form @submit.prevent="onSubmit" class="app-login__form">
          <h2 class="app-login__title">BIENVENIDO</h2>

          <ion-list class="app-login__list" inset lines="none" mode="ios">
            <ion-item class="app-login__item auth-field-item" lines="none" mode="ios">
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

            <ion-item class="app-login__item auth-field-item" lines="none" mode="ios">
              <ion-icon slot="start" :icon="lockIcon" class="app-login__item-icon" />
              <ion-input
                v-model="form.password"
                autocomplete="current-password"
                :type="isPasswordVisible ? 'text' : 'password'"
                placeholder="Contraseña"
                minlength="6"
                required
                class="app-login__input"
              />
              <ion-button
                slot="end"
                fill="clear"
                size="small"
                type="button"
                class="auth-field-toggle"
                :aria-label="isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="togglePasswordVisibility"
              >
                <ion-icon :icon="isPasswordVisible ? eyeOffIcon : eyeIcon" />
              </ion-button>
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
import { computed, reactive, onMounted, ref } from 'vue'
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
import { mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons'
import '@/theme/AuthPage.css'
import { useAuth } from '../composables/useAuth.js'

const emit = defineEmits(['success'])

const form = reactive({
  email: '',
  password: ''
})

const isPasswordVisible = ref(false)

const mailIcon = mailOutline
const lockIcon = lockClosedOutline
const eyeIcon = eyeOutline
const eyeOffIcon = eyeOffOutline

const { login, isLoading, authError } = useAuth()

const errorMessage = computed(() => authError.value)

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

onMounted(() => {
  authError.value = null
})

const onSubmit = async () => {
  const { error, data } = await login({ ...form })
  if (!error) {
    form.email = ''
    form.password = ''
    isPasswordVisible.value = false
    emit('success', data)
  }
}
</script>
