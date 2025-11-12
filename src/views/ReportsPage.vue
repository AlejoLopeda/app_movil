<!-- src/views/Reportes.vue -->
<template>
  <ion-page>
    <app-top-bar :title="'REPORTES'" />

    <!-- 🔔 Notificación interna estilo Nequi (banner superior) -->
    <transition name="slide-down">
      <div
        v-if="notice.open"
        :class="['inapp-notice', notice.type]"
        role="status"
        aria-live="polite"
      >
        <ion-icon :icon="noticeIcon" class="ni" />
        <span class="txt">{{ notice.msg }}</span>
      </div>
    </transition>

    <!-- 👇 Scroll desactivado -->
    <ion-content class="report-content" fullscreen :scroll-y="false">
      <div class="screen">
        <div class="card">
          <h2 class="title">Generación de reportes</h2>

          <!-- Diario -->
          <div
            class="block"
            :class="{ selected: selectedKind==='DIARIO' }"
            @pointerdown.prevent="select('DIARIO')"
          >
            <h3>Diario</h3>
            <ion-item lines="none" class="input-item">
              <ion-label position="stacked">Fecha</ion-label>
              <ion-input type="date" v-model="day" class="white-input" />
            </ion-item>
          </div>

          <!-- Semanal -->
          <div
            class="block block--semanal"
            :class="{ selected: selectedKind==='SEMANAL' }"
            @pointerdown.prevent="select('SEMANAL')"
          >
            <h3>Semanal</h3>
            <div class="row-semanal">
              <ion-item lines="none" class="col input-item">
                <ion-label position="stacked">Desde</ion-label>
                <ion-input type="date" v-model="weekFrom" class="white-input" />
              </ion-item>
              <ion-item lines="none" class="col input-item">
                <ion-label position="stacked">Hasta</ion-label>
                <ion-input type="date" v-model="weekTo" class="white-input" />
              </ion-item>
            </div>
            <ion-note v-if="!validWeek" color="danger" style="margin-top:-6px">
              El rango es inválido.
            </ion-note>
          </div>

          <!-- Mensual -->
          <div
            class="block"
            :class="{ selected: selectedKind==='MENSUAL' }"
            @pointerdown.prevent="select('MENSUAL')"
          >
            <h3>Mensual</h3>
            <ion-item lines="none" class="input-item">
              <ion-label position="stacked">Mes</ion-label>
              <ion-input type="month" v-model="month" placeholder="YYYY-MM" class="white-input" />
            </ion-item>
            <ion-note v-if="!validMonth" color="danger" style="margin-top:-6px">
              Mes inválido.
            </ion-note>
          </div>

          <ion-note v-if="err" color="danger" style="display:block; margin-top:8px;">
            {{ err }}
          </ion-note>
        </div>
      </div>

      <ion-toast
        :is-open="toast.open"
        :message="toast.msg"
        :duration="2200"
        color="success"
        @didDismiss="toast.open=false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonContent, IonItem, IonLabel, IonInput,
  IonButton, IonNote, IonToast, IonIcon
} from '@ionic/vue'
import { checkmarkCircleOutline, alertCircleOutline, informationCircleOutline } from 'ionicons/icons'
import AppTopBar from '@/components/AppTopBar.vue'

const router = useRouter()
const loading = ref(false)
const err = ref('')
const toast = ref({ open: false, msg: '' })

// 🔔 Banner in-app
const notice = ref({ open: false, type: 'info', msg: '' })
function showNotice (msg, type = 'info', autoCloseMs = 2200) {
  notice.value = { open: true, type, msg }
  if (autoCloseMs > 0) setTimeout(() => { notice.value.open = false }, autoCloseMs)
}
const noticeIcon = computed(() => (
  notice.value.type === 'success' ? checkmarkCircleOutline
    : notice.value.type === 'error' ? alertCircleOutline
    : informationCircleOutline
))

// Fechas
const todayISO = new Date().toISOString().slice(0, 10)
const day = ref(todayISO)
const weekFrom = ref(todayISO)
const weekTo = ref(todayISO)
const validWeek = computed(() => !!weekFrom.value && !!weekTo.value && weekFrom.value <= weekTo.value)
const month = ref(todayISO.slice(0, 7))
const validMonth = computed(() => /^\d{4}-\d{2}$/.test(month.value || ''))

function humanRange (from, to) {
  const [y1, m1, d1] = from.split('-')
  const [y2, m2, d2] = to.split('-')
  return `${d1}/${m1}/${y1} – ${d2}/${m2}/${y2}`
}
function humanDay (d) {
  const [y, m, dd] = d.split('-')
  return `${dd}/${m}/${y}`
}
function monthBounds (ym) {
  const [y, m] = ym.split('-').map(n => Number(n))
  const first = new Date(y, m - 1, 1)
  const last  = new Date(y, m, 0)
  const toISO = (dt) => dt.toISOString().slice(0, 10)
  return { from: toISO(first), to: toISO(last) }
}

/* ========= Selección + botón PREVISUALIZAR ========= */
const selectedKind = ref('DIARIO')

function select(kind){ selectedKind.value = kind }

function goPreview({ kind, from, to, label }) {
  router.push({ name: 'Reportpreview', query: { kind, from, to, label } })
}

function goPreviewBySelection () {
  const kind = selectedKind.value
  if (kind === 'DIARIO') {
    const from = day.value
    const to = day.value
    const label = humanDay(day.value)
    goPreview({ kind, from, to, label })
  } else if (kind === 'SEMANAL') {
    if (!validWeek.value) return
    const from = weekFrom.value
    const to = weekTo.value
    const label = humanRange(from, to)
    goPreview({ kind, from, to, label })
  } else if (kind === 'MENSUAL') {
    if (!validMonth.value) return
    const { from, to } = monthBounds(month.value)
    const [y, m] = month.value.split('-')
    const monthName = new Date(Number(y), Number(m) - 1, 1)
      .toLocaleString('es-CO', { month: 'long', year: 'numeric' })
    const label = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    goPreview({ kind, from, to, label })
  }
}

function onBottomPreview(){ goPreviewBySelection() }
onMounted(() => { window.addEventListener('bottom-preview', onBottomPreview) })
onUnmounted(() => { window.removeEventListener('bottom-preview', onBottomPreview) })
</script>

<style scoped>
/* 👇 oculta scrollbar vertical en esta vista */
.report-content {
  --background: #f5fbfc;
  overflow-y: hidden !important;
}

/* Centrado del contenido y espacio para la bottom bar */
.screen {
  padding: 16px;
  padding-bottom: 88px;          /* evita solaparse con la navbar inferior */
  display: grid;
  place-content: start center;   /* centrado horizontal */
  min-height: 100%;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior: contain;
  touch-action: manipulation;    /* evita doble-tap zoom/bounce */
}

.card {
  width: min(92vw, 520px);
  margin: 8px auto 0;            /* centra el card */
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 6px 18px rgba(0,0,0,.06);
  padding: 16px;
  touch-action: manipulation;
}

.title { margin: 6px 0 12px; color: #0b3a43; font-weight: 800; font-size: 20px; text-align: center; }
.block { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #d0e3e6; }
.block h3 { margin: 0 0 6px; color: #0b3a43; font-weight: 700; }
.input-item { --background: transparent; margin-bottom: 6px; }

.white-input {
  --background: #fff;
  --color: #000;
  --placeholder-color: #444;
  border-radius: 10px;
  padding: 8px;
}

/* 🟢 Ajuste solo para SEMANAL */
.block--semanal .row-semanal {
  display: flex;
  justify-content: center;
  gap: 10px;
}
.block--semanal .row-semanal .col {
  flex: 0 0 45%;
  max-width: 160px;
}
.block--semanal .white-input { width: 100%; }

/* ✅ Feedback de bloque seleccionado */
.block.selected {
  outline: 2px solid #0b3a43;
  border-radius: 12px;
  background: #f0f6f7;
}

/* 🔔 Notificación interna (banner) */
.inapp-notice {
  position: fixed;
  left: 12px;
  right: 12px;
  top: calc(env(safe-area-inset-top, 0px) + 8px);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #111;
  color: #fff;
  box-shadow: 0 10px 24px rgba(0,0,0,.18);
  transform: translateZ(0);
  pointer-events: none;
}
.inapp-notice.success { background: #104e27; }
.inapp-notice.error   { background: #7a1c1c; }
.inapp-notice.info    { background: #243447; }
.inapp-notice .ni  { font-size: 20px; }
.inapp-notice .txt { font-weight: 600; }

/* Animación */
.slide-down-enter-active, .slide-down-leave-active { transition: all .25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translate3d(0,-12px,0); }
</style>
