<template>
  <teleport to="body">
    <!-- Overlay: no cubre la toolbar; cierra al tocar fuera -->
    <div
      v-if="open"
      class="user-speed-overlay"
      :style="overlayStyle"
      @click="$emit('close')"
    ></div>

    <!-- Speed-dial flotante (misma UI que antes) -->
    <div
      v-if="open"
      class="user-speed"
      :style="speedStyle"
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
import { computed } from 'vue'
import { IonButton, IonIcon } from '@ionic/vue'
import { createOutline, documentTextOutline, logOutOutline } from 'ionicons/icons'

const props = defineProps({
  open: { type: Boolean, default: false },
  /** alto de tu toolbar (por defecto 56px en Ionic) */
  toolbarHeight: { type: Number, default: 56 },
  /** pequeño margen extra para separar el speed-dial de la toolbar */
  topGap: { type: Number, default: 4 }
})
defineEmits(['close', 'edit', 'report', 'logout'])

/** El overlay empieza justo debajo de la toolbar (respetando safe-area) */
const overlayStyle = computed(() => ({
  top: `calc(var(--ion-safe-area-top) + ${props.toolbarHeight}px)`
}))

/** El speed-dial se coloca un pelín más abajo para que no “pegue” con la barra */
const speedStyle = computed(() => ({
  top: `calc(env(safe-area-inset-top) + ${props.toolbarHeight + props.topGap}px)`
}))
</script>