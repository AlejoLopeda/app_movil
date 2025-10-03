<template>
  <section class="app-account">
    <ion-card class="app-account__card" mode="ios">
      <ion-card-content>
        <form @submit.prevent="onSubmit" class="app-account__form">
          <h2 class="app-account__title">CREA TU CUENTA</h2>
          <ion-list class="app-account__list" inset lines="none">
          <ion-item class="app-account__item" lines="none" style="border:2px solid #000;border-radius:16px;--border-width:0;--inner-border-width:0;--highlight-height:0;--highlight-color-focused:transparent;--padding-start:12px;--inner-padding-end:12px;">
              <ion-icon slot="start" :icon="personIcon" class="app-account__item-icon" />
              <ion-input
                v-model="form.name"
                autocomplete="name"
                placeholder="Nombre"
                type="text"
                required
                class="app-account__input"
              />
            </ion-item>

          <ion-item class="app-account__item" lines="none" style="border:2px solid #000;border-radius:16px;--border-width:0;--inner-border-width:0;--highlight-height:0;--highlight-color-focused:transparent;--padding-start:12px;--inner-padding-end:12px;">
              <ion-icon slot="start" :icon="mailIcon" class="app-account__item-icon" />
              <ion-input
                v-model="form.email"
                autocomplete="email"
                inputmode="email"
                placeholder="Ingresa un correo"
                type="email"
                required
                class="app-account__input"
              />
            </ion-item>

          <ion-item class="app-account__item" lines="none" style="border:2px solid #000;border-radius:16px;--border-width:0;--inner-border-width:0;--highlight-height:0;--highlight-color-focused:transparent;--padding-start:12px;--inner-padding-end:12px;">
              <ion-icon slot="start" :icon="lockIcon" class="app-account__item-icon" />
              <ion-input
                v-model="form.password"
                autocomplete="new-password"
                placeholder="Ingresa una contrasena"
                type="password"
                minlength="6"
                required
                class="app-account__input"
              />
            </ion-item>

          <ion-item class="app-account__item" lines="none" style="border:2px solid #000;border-radius:16px;--border-width:0;--inner-border-width:0;--highlight-height:0;--highlight-color-focused:transparent;--padding-start:12px;--inner-padding-end:12px;">
              <ion-icon slot="start" :icon="lockIcon" class="app-account__item-icon" />
              <ion-input
                v-model="form.passwordConfirmation"
                autocomplete="new-password"
                placeholder="Confirmar contrasena"
                type="password"
                minlength="6"
                required
                class="app-account__input"
              />
            </ion-item>
          </ion-list>
          <ion-text v-if="errorMessage" color="danger" class="app-account__feedback">
          {{ errorMessage }}
        </ion-text>
        <ion-text
          v-else-if="successMessage"
          color="success"
          class="app-account__feedback"
        >
          {{ successMessage }}
        </ion-text>
          <div class="app-account__terms">
            <ion-checkbox
              v-model="form.acceptTerms"
              class="app-account__checkbox"
              aria-label="Acepto los terminos y condiciones"
            />
            <span class="app-account__terms-text">Acepto los terminos y condiciones.</span>
          </div>

          <ion-button
            class="app-account__link"
            fill="clear"
            size="small"
            type="button"
            href="#"
          >
            Leer terminos y condiciones
          </ion-button>

          <ion-button
            class="app-account__submit"
            type="submit"
            expand="block"
            shape="round"
            :disabled="isLoading"
          >
            <template v-if="isLoading">
              <ion-spinner name="crescent" class="app-account__spinner" />
              Creando cuenta...
            </template>
            <template v-else>
              Ingresar
            </template>
          </ion-button>
        </form>
      </ion-card-content>
    </ion-card>
  </section>
</template>

<script setup>
import { computed, reactive, watch, onMounted } from 'vue'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonSpinner,
  IonText
} from '@ionic/vue'
import { personOutline, mailOutline, lockClosedOutline } from 'ionicons/icons'
import { useAuth } from '../composables/useAuth.js'

const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  acceptTerms: false
})

const personIcon = personOutline
const mailIcon = mailOutline
const lockIcon = lockClosedOutline

const { register, isLoading, authError, registrationResult } = useAuth()

const errorMessage = computed(() => authError.value)
const successMessage = computed(() => {
  if (!registrationResult.value) {
    return ''
  }

  if (registrationResult.value?.user) {
    return 'Listo, revisa tu correo para confirmar la cuenta.'
  }

  return 'Registro enviado correctamente.'
})

onMounted(() => {
  authError.value = null
})

watch(registrationResult, (result) => {
  if (result) {
    form.name = ''
    form.email = ''
    form.password = ''
    form.passwordConfirmation = ''
    form.acceptTerms = false
  }
})

const onSubmit = async () => {
  if (!form.acceptTerms) {
    authError.value = 'Debes aceptar los terminos y condiciones.'
    return
  }

  await register({ ...form })
}
</script>

<style scoped>
.app-account {
  width: 100%;
}

.app-account__card {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 28px;
  box-shadow: none;
  --background: #ffffff;
  padding: 1.75rem 1.5rem 2rem;
}

.app-account__title {
  margin: 0;
  text-align: center;
  font-size: 1.6rem;
  font-weight: 700;
  color: #0d0d0d;
}

.app-account__form {
  display: grid;
  gap: 1rem;
}

.app-account__list {
  --background: transparent;
  background-color: #ffffff;
  padding: 0;
}

.app-account__item {
  --background: #ffffff;
  --border-color: #0d0d0d;
  --border-radius: 18px;
  --border-width: 2px;
  --border-style: solid;
  --padding-start: 14px;
  --inner-padding-end: 14px;
  align-items: center;
}

.app-account__item + .app-account__item {
  margin-top: 0.75rem;
}

.app-account__item-icon {
  font-size: 1.4rem;
  color: #0d0d0d;
}

.app-account__input {
  --placeholder-font-weight: 600;
  font-weight: 600;
  color: #0d0d0d;
}

.app-account__terms {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: #0d0d0d;
}

.app-account__checkbox {
  --size: 22px;
}

.app-account__link {
  justify-self: center;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0d3f48;
}

.app-account__submit {
  --background: #cbdcff;
  --color: #0d0d0d;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.app-account__spinner {
  margin-right: 0.5rem;
}

.app-account__feedback {
  display: block;
  margin-top: 1rem;
  text-align: center;
  font-weight: 600;
}
</style>
