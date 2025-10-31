<template>
  <teleport to="body">
    <!-- Overlay: no cubre la toolbar; cierra al tocar fuera -->
    <div
      v-if="open"
      class="user-speed-overlay"
      @click="$emit('close')"
    ></div>

    <!-- Speed-dial flotante -->
    <div
      v-if="open"
      class="user-speed"
      @click.self="$emit('close')"
    >
      <ion-button
        class="user-speed__btn"
        shape="round"
        fill="solid"
        @click="() => { $emit('close'); $emit('edit') }"
        aria-label="Editar perfil"
        title="Editar perfil"
      >
        <ion-icon :icon="createOutline" aria-hidden="true" />
      </ion-button>

      <ion-button
        class="user-speed__btn"
        shape="round"
        fill="solid"
        @click="() => { $emit('close'); $emit('report') }"
        aria-label="Generar reporte"
        title="Generar reporte (PDF)"
      >
        <ion-icon :icon="documentTextOutline" aria-hidden="true" />
      </ion-button>

      <ion-button
        class="user-speed__btn user-speed__btn--danger"
        color="danger"
        shape="round"
        fill="solid"
        @click="() => { $emit('close'); $emit('logout') }"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <ion-icon :icon="logOutOutline" aria-hidden="true" />
      </ion-button>
    </div>
  </teleport>
</template>

<script setup>
import { IonButton, IonIcon } from '@ionic/vue'
import { createOutline, documentTextOutline, logOutOutline } from 'ionicons/icons'

defineProps({
  open: { type: Boolean, default: false }
})
defineEmits(['close', 'edit', 'report', 'logout'])
</script>
