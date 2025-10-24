<template>
  <section class="history-filters ion-padding">
    <!-- Fecha -->
    <button
      class="filter-btn icon-only"
      @click="$emit('open-date', $event)"
      aria-label="Elegir fecha"
    >
      <ion-icon :icon="calendarIcon" />
      <span>{{ dateLabel }}</span>
    </button>

    <!-- Categorías -->
    <button class="filter-btn" @click="$emit('open-cat')" aria-label="Elegir categorías">
      <ion-icon :icon="gridIcon" />
      <span>{{ categoriesLabel }}</span>
    </button>
  </section>

  <section v-if="chips?.length" class="history-chips ion-padding-horizontal">
    <span v-for="c in chips" :key="c" class="chip">{{ c }}</span>
  </section>

  <!-- ⤵️ Fecha: ahora como MODAL (mismo look & feel que categorías) -->
  <ion-modal
    :is-open="dateOpen"
    @didDismiss="$emit('close-date')"
    :keep-contents-mounted="true"
    backdrop-dismiss="true"
    style="
      --width: min(620px, 92vw);
      --height: auto;
      --max-height: 80vh;
      --border-radius: 20px;
    "
  >
    <div class="modal date-modal">
      <header>
        <h3>Rango de fechas</h3>
        <p>Elige una fecha de inicio y una de fin.</p>
      </header>

      <div class="date-grid">
        <ion-item>
          <ion-label position="stacked">Desde</ion-label>
          <ion-input
            type="date"
            style="--color:#0b3a43; --placeholder-color:#0b3a43; color-scheme:light;"
            :value="from ? from.slice(0,10) : ''"
            @ionChange="$emit('update:from', $event.detail.value || null)"
          />
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Hasta</ion-label>
          <ion-input
            type="date"
            style="--color:#0b3a43; --placeholder-color:#0b3a43; color-scheme:light;"
            :value="to ? to.slice(0,10) : ''"
            @ionChange="$emit('update:to', $event.detail.value || null)"
          />
        </ion-item>
      </div>

      <ion-note v-if="dateError" color="danger" class="modal-note">{{ dateError }}</ion-note>

      <!-- Acciones: Restablecer / Aplicar -->
      <div class="modal-actions actions-row">
        <ion-button class="btn-primary" @click="$emit('clear-dates')">
          RESTABLECER
        </ion-button>
        <ion-button class="btn-primary" @click="$emit('apply-dates')">
          APLICAR
        </ion-button>
      </div>

      <!-- Cerrar centrado -->
      <div class="close-row">
        <ion-button class="btn-primary" @click="$emit('close-date')">
          CERRAR
        </ion-button>
      </div>
    </div>
  </ion-modal>

  <!-- Modal: Categorías (centrado, con Cerrar/Restablecer/Aplicar) -->
  <ion-modal
    :is-open="catOpen"
    @didDismiss="$emit('close-cat')"
    :keep-contents-mounted="true"
    backdrop-dismiss="true"
    style="
      --width: min(620px, 92vw);
      --height: auto;
      --max-height: 80vh;
      --border-radius: 20px;
    "
  >
    <div class="modal cat-modal">
      <header>
        <h3>Categorías</h3>
        <p>Selecciona una o más. Siempre habrá al menos una.</p>
      </header>

      <div class="cat-grid">
        <button class="cat-chip" :class="{ active: allCatsSelected }" @click="$emit('toggle-all')">Todas</button>
        <button
          v-for="c in visibleCategories"
          :key="c.key"
          class="cat-chip"
          :class="{ active: selectedCats.has(c.key) }"
          @click="$emit('toggle-cat', c.key)"
        >
          <ion-icon :icon="iconFor(c.key)" />
          <span>{{ c.label }}</span>
        </button>
      </div>

      <!-- Fila de acciones: Restablecer / Aplicar -->
      <div class="modal-actions actions-row">
        <ion-button class="btn-primary" @click="$emit('reset-cats')">
          RESTABLECER
        </ion-button>
        <ion-button class="btn-primary" @click="$emit('apply-cats')">
          APLICAR
        </ion-button>
      </div>

      <!-- Botón Cerrar centrado abajo -->
      <div class="close-row">
        <ion-button class="btn-primary" @click="$emit('close-cat')">
          CERRAR
        </ion-button>
      </div>
    </div>
  </ion-modal>
</template>

<script setup>
import {
  IonPopover, IonModal, IonButton, IonItem, IonLabel, IonIcon, IonNote, IonInput
} from '@ionic/vue'
import { calendarOutline, gridOutline } from 'ionicons/icons'

defineProps({
  from: String,
  to: String,
  dateOpen: Boolean,
  dateEvent: Object,
  catOpen: Boolean,
  dateError: String,
  dateLabel: String,
  categoriesLabel: String,
  chips: Array,
  visibleCategories: { type: Array, default: () => [] },
  selectedCats: { type: Object, required: true },
  allCatsSelected: Boolean,
  iconFor: { type: Function, required: true }
})

defineEmits([
  'open-date', 'open-cat',
  'close-date', 'close-cat',
  'update:from', 'update:to',
  'clear-dates', 'apply-dates',
  'toggle-all', 'reset-cats', 'toggle-cat', 'apply-cats'
])

const calendarIcon = calendarOutline
const gridIcon = gridOutline
</script>

<style src="../theme/history.css"></style>
