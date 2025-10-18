<template>
  <section class="history-filters ion-padding">
    <!-- Fecha: icono solo -->
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

  <!-- Popover: Fecha (anclado al click, look compacto) -->
  <ion-popover
    :is-open="dateOpen"
    :event="dateEvent"
    reference="event"
    side="bottom"                           <!-- ✅ asegura el anclaje hacia abajo -->
    alignment="start"
    :keep-contents-mounted="true"
    @didDismiss="$emit('close-date')"
    style="--width: min(360px, 92vw); --max-width: 92vw;"
  >
    <div class="modal modal--dates">
      <header><h3>Rango de fechas</h3></header>

      <div class="modal-row">
        <ion-item>
          <ion-label position="stacked">Desde</ion-label>
          <div class="dt-wrap">
            <ion-datetime
              presentation="date"
              :value="from || undefined"
              locale="es-ES"
              first-day-of-week="1"
              :show-default-buttons="false"
              @ionChange="$emit('update:from', $event.detail.value)"
            />
          </div>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Hasta</ion-label>
          <div class="dt-wrap">
            <ion-datetime
              presentation="date"
              :value="to || undefined"
              locale="es-ES"
              first-day-of-week="1"
              :show-default-buttons="false"
              @ionChange="$emit('update:to', $event.detail.value)"
            />
          </div>
        </ion-item>
      </div>

      <div class="modal-actions">
        <ion-button fill="clear" @click="$emit('clear-dates')">Limpiar</ion-button>
        <ion-button @click="$emit('apply-dates')">Aplicar</ion-button>
      </div>

      <ion-note v-if="dateError" color="danger" class="modal-note">{{ dateError }}</ion-note>
    </div>
  </ion-popover>

  <!-- Modal: Categorías -->
  <ion-modal
    :is-open="catOpen"
    @didDismiss="$emit('close-cat')"
    :breakpoints="[0, 0.6, 1]"
    :initial-breakpoint="0.6"
    :keep-contents-mounted="true"          <!-- ✅ evita flicker y respeta estilos -->
    style="
      --width: min(560px, 94vw);
      --max-width: 94vw;
      --height: auto;
      --max-height: 72vh;
      --border-radius: 16px;
    "
  >
    <!-- ✅ clase extra para estilos globales de categorías -->
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

      <div class="modal-actions">
        <ion-button fill="clear" @click="$emit('reset-cats')">Restablecer</ion-button>
        <ion-button @click="$emit('apply-cats')">Aplicar</ion-button>
      </div>
    </div>
  </ion-modal>
</template>

<script setup>
import {
  IonPopover, IonModal, IonButton, IonDatetime, IonItem, IonLabel, IonIcon, IonNote
} from '@ionic/vue'
import { calendarOutline, gridOutline } from 'ionicons/icons'

defineProps({
  from: String,
  to: String,
  dateOpen: Boolean,
  dateEvent: Object,                 // evento para anclar el popover
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
