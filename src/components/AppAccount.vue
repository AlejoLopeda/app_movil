<template>
  <section class="app-account">
    <ion-card class="app-account__card" mode="ios">
      <ion-card-content>
        <form @submit.prevent="onSubmit" class="app-account__form">
          <h2 class="app-account__title">CREA TU CUENTA</h2 >
          <ion-list class="app-account__list" inset lines="none">
          <ion-item class="app-account__item auth-field-item" lines="none">
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

          <ion-item class="app-account__item auth-field-item" lines="none">
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

          <ion-item class="app-account__item auth-field-item" lines="none">
              <ion-icon slot="start" :icon="lockIcon" class="app-account__item-icon" />
              <ion-input
                v-model="form.password"
                autocomplete="new-password"
                :type="isPasswordVisible ? 'text' : 'password'"
                placeholder="Ingresar contraseña"
                minlength="6"
                required
                class="app-account__input"
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

          <ion-item class="app-account__item auth-field-item" lines="none">
              <ion-icon slot="start" :icon="lockIcon" class="app-account__item-icon" />
              <ion-input
                v-model="form.passwordConfirmation"
                autocomplete="new-password"
                :type="isPasswordConfirmationVisible ? 'text' : 'password'"
                placeholder="Confirmar contraseña"
                minlength="6"
                required
                class="app-account__input"
              />
              <ion-button
                slot="end"
                fill="clear"
                size="small"
                type="button"
                class="auth-field-toggle"
                :aria-label="isPasswordConfirmationVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="togglePasswordConfirmationVisibility"
              >
                <ion-icon :icon="isPasswordConfirmationVisible ? eyeOffIcon : eyeIcon" />
              </ion-button>
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
import { computed, reactive, watch, onMounted, ref } from 'vue'
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
import { personOutline, mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons'
import '@/theme/AuthPage.css'
import { useAuth } from '../composables/useAuth.js'

const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  acceptTerms: false
})

const isPasswordVisible = ref(false)
const isPasswordConfirmationVisible = ref(false)

const personIcon = personOutline
const mailIcon = mailOutline
const lockIcon = lockClosedOutline
const eyeIcon = eyeOutline
const eyeOffIcon = eyeOffOutline

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

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

const togglePasswordConfirmationVisibility = () => {
  isPasswordConfirmationVisible.value = !isPasswordConfirmationVisible.value
}

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
    isPasswordVisible.value = false
    isPasswordConfirmationVisible.value = false
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
