<template>
  <section class="app-login">
    <ion-card class="app-login__card" mode="ios">
      <ion-card-content>
        <form @submit.prevent="onSubmit" class="app-login__form">
          <h2 class="app-login__title">BIENVENIDO</h2>

          <ion-list class="app-login__list" inset lines="none">
            <ion-item class="app-login__item" lines="none" :style="itemStyles">
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

            <ion-item class="app-login__item" lines="none" :style="itemStyles">
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
import { useAuth } from '../composables/useAuth.js'

const emit = defineEmits(['success'])

const form = reactive({
  email: '',
  password: ''
})

const itemStyles = {
  border: '2px solid #000',
  borderRadius: '16px',
  '--border-width': 0,
  '--inner-border-width': 0,
  '--highlight-height': 0,
  '--highlight-color-focused': 'transparent',
  '--padding-start': '12px',
  '--inner-padding-end': '12px'
}

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

<style scoped>
.app-login {
  width: 100%;
}

.app-login__card {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 28px;
  box-shadow: none;
  --background: #ffffff;
  padding: 1.75rem 1.5rem 2rem;
}

.app-login__title {
  margin: 0;
  text-align: center;
  font-size: 1.6rem;
  font-weight: 700;
  color: #0d0d0d;
}

.app-login__form {
  display: grid;
  gap: 1.5rem;
}

.app-login__list {
  --background: transparent;
  background-color: #ffffff;
  padding: 0;
}

.app-login__item + .app-login__item {
  margin-top: 0.75rem;
}

.app-login__item-icon {
  font-size: 1.4rem;
  color: #0d0d0d;
}

.app-login__input {
  --placeholder-font-weight: 600;
  font-weight: 600;
  color: #0d0d0d;
}

.app-login__submit {
  --background: #0d3f48;
  --color: #ffffff;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.app-login__spinner {
  margin-right: 0.5rem;
}

.app-login__feedback {
  display: block;
  margin-top: -0.5rem;
  text-align: center;
  font-weight: 600;
}
</style>
