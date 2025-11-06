<!-- src/views/Reportes.vue (preview HTML + descarga PDF desde navbar) -->

<template>
  <ion-page>
    <app-top-bar :title="'REPORTES'" />

    <ion-content class="report-content" fullscreen>
      <div class="screen">
        <div class="card">
          <h2 class="title">Generación de reportes</h2>

          <!-- Diario -->
          <div class="block">
            <h3>Diario</h3>
            <ion-item lines="none" class="input-item">
              <ion-label position="stacked">Fecha</ion-label>
              <ion-input type="date" v-model="day" class="white-input" />
            </ion-item>
            <ion-button expand="block" class="btn" @click="genDaily" :disabled="loading">
              PREVISUALIZAR (DÍA)
            </ion-button>
          </div>

          <!-- Semanal -->
          <div class="block">
            <h3>Semanal</h3>
            <div class="row">
              <ion-item lines="none" class="col input-item">
                <ion-label position="stacked">Desde</ion-label>
                <ion-input type="date" v-model="weekFrom" class="white-input" />
              </ion-item>
              <ion-item lines="none" class="col input-item">
                <ion-label position="stacked">Hasta</ion-label>
                <ion-input type="date" v-model="weekTo" class="white-input" />
              </ion-item>
            </div>
            <ion-button expand="block" class="btn" @click="genWeekly" :disabled="!validWeek || loading">
              PREVISUALIZAR (RANGO)
            </ion-button>
            <ion-note v-if="!validWeek" color="danger" style="margin-top:-6px">
              El rango es inválido.
            </ion-note>
          </div>

          <!-- Mensual -->
          <div class="block">
            <h3>Mensual</h3>
            <ion-item lines="none" class="input-item">
              <ion-label position="stacked">Mes</ion-label>
              <ion-input type="month" v-model="month" placeholder="YYYY-MM" class="white-input" />
            </ion-item>
            <ion-button expand="block" class="btn" @click="genMonthly" :disabled="!validMonth || loading">
              PREVISUALIZAR (MES)
            </ion-button>
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

      <!-- ===== MODAL PREVISUALIZACIÓN (HTML, sin PDF) ===== -->
      <ion-modal
        :is-open="previewOpen"
        :backdrop-dismiss="false"
        @didDismiss="closePreview"
      >
        <div class="preview-modal">
          <div class="preview-header">
            <div class="preview-title">
              <strong>Vista previa – {{ currentKind }}</strong>
            </div>
            <div class="preview-actions">
              <!-- El botón de descargar está en la navbar inferior -->
              <ion-button size="small" @click="closePreview">CERRAR</ion-button>
            </div>
          </div>

          <!-- Previsualización simple en HTML (lo que irá al PDF) -->
          <div class="native-preview">
            <h4 class="h1">REPORTE {{ currentKind }}</h4>
            <div class="period">Período: {{ periodLabel }}</div>

            <table class="tbl">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th class="ar">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ingresos</td>
                  <td class="ar">{{ money(incomes) }}</td>
                </tr>
                <tr>
                  <td>Gastos</td>
                  <td class="ar">{{ money(expenses) }}</td>
                </tr>
                <tr class="bold">
                  <td>{{ balanceStatus }}</td>
                  <td class="ar">{{ money(balance) }}</td>
                </tr>
              </tbody>
            </table>

            <h5 class="h2">Resumen</h5>
            <ul class="ul">
              <li>Ingresos del período: {{ money(incomes) }}</li>
              <li>Gastos del período: {{ money(expenses) }}</li>
              <li>Balance: {{ money(balance) }}</li>
            </ul>

            <p :class="['advice', balance >= 0 ? 'ok' : 'bad']">
              {{ adviceText }}
            </p>
          </div>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  IonPage,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonNote,
  IonToast,
  IonModal
} from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import { getTotals } from '@/services/transactionsService'
import { buildReportDoc, saveNative, makeFileName } from '@/services/reportPdfService'

const loading = ref(false)
const err = ref('')
const toast = ref({ open: false, msg: '' })

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

// Estado de preview
const previewOpen = ref(false)
const currentKind = ref('')       // DIARIO/SEMANAL/MENSUAL
const periodLabel = ref('')       // etiqueta humana
const fromISO = ref('')           // para reconstruir PDF al guardar
const toISO = ref('')

// Datos mostrados en preview
const incomes = ref(0)
const expenses = ref(0)
const balance = computed(() => (incomes.value || 0) - (expenses.value || 0))
const nf = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const money = (v) => nf.format(v || 0)
const balanceStatus = computed(() =>
  balance.value > 0 ? 'SALDO POSITIVO' :
  balance.value < 0 ? 'SALDO NEGATIVO' :
  'SALDO NEUTRO'
)
const adviceText = computed(() =>
  balance.value > 0
    ? '¡Bien! Mantén el control: considera ahorrar un % de tu excedente.'
    : balance.value < 0
      ? 'Atención: revisa tus gastos y fija límites para equilibrar tus cuentas.'
      : 'Vas justo. Un pequeño ajuste en gastos o un ingreso extra mejorará tu balance.'
)

/* === Integración con navbar inferior === */
function setDownloadEnabled(enabled){
  window.dispatchEvent(new CustomEvent('report-can-download', { detail: { enabled: !!enabled } }))
}

function closePreview () {
  previewOpen.value = false
  setDownloadEnabled(false)
}

// Escucha del click "DESCARGAR" en navbar
async function onBottomDownload(){
  await downloadFromPreview()
}

onMounted(() => {
  setDownloadEnabled(false)
  window.addEventListener('bottom-download', onBottomDownload)
})

onUnmounted(() => {
  window.removeEventListener('bottom-download', onBottomDownload)
  setDownloadEnabled(false)
})

// Handlers
async function genDaily () {
  await generate({ kind: 'DIARIO', from: day.value, to: day.value, periodLabel: humanDay(day.value) })
}
async function genWeekly () {
  if (!validWeek.value) return
  await generate({ kind: 'SEMANAL', from: weekFrom.value, to: weekTo.value, periodLabel: humanRange(weekFrom.value, weekTo.value) })
}
async function genMonthly () {
  if (!validMonth.value) return
  const { from, to } = monthBounds(month.value)
  const [y, m] = month.value.split('-')
  const monthName = new Date(Number(y), Number(m) - 1, 1).toLocaleString('es-CO', { month: 'long', year: 'numeric' })
  await generate({ kind: 'MENSUAL', from, to, periodLabel: monthName.charAt(0).toUpperCase() + monthName.slice(1) })
}

async function generate ({ kind, from, to, periodLabel: pLabel }) {
  loading.value = true
  err.value = ''
  try {
    const totals = await getTotals({ from, to })

    currentKind.value = kind
    periodLabel.value = pLabel
    fromISO.value = from
    toISO.value = to
    incomes.value = totals.incomes
    expenses.value = totals.expenses

    previewOpen.value = true
    setDownloadEnabled(true)
  } catch (e) {
    console.error(e)
    err.value = e?.message || 'No se pudo generar el reporte.'
  } finally {
    loading.value = false
  }
}

async function downloadFromPreview () {
  try {
    // Cerrar la previsualización inmediatamente al iniciar la descarga
    closePreview()

    const doc = buildReportDoc({
      kind: currentKind.value,
      periodLabel: periodLabel.value,
      from: fromISO.value,
      to: toISO.value,
      incomes: incomes.value,
      expenses: expenses.value
    })
    await saveNative(doc, makeFileName(currentKind.value))
    toast.value = { open: true, msg: 'PDF guardado / abierto.' }
  } catch (e) {
    console.error(e)
    err.value = e?.message || 'No se pudo guardar/abrir el PDF.'
  }
}
</script>

<style scoped>
.report-content { --background: #f5fbfc; }
.screen { padding: 16px; display: grid; place-items: start; }
.card {
  width: 100%;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 6px 18px rgba(0,0,0,.06);
  padding: 16px;
}
.title { margin: 6px 0 12px; color: #0b3a43; font-weight: 800; font-size: 20px; text-align: center; }
.block { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #d0e3e6; }
.block h3 { margin: 0 0 6px; color: #0b3a43; font-weight: 700; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.col { --padding-start: 0; }

.white-input {
  --background: #fff;
  --color: #000;
  --placeholder-color: #444;
  border-radius: 10px;
  padding: 8px;
}
.input-item { --background: transparent; margin-bottom: 6px; }

.btn {
  --background: #0b3a43;
  --color: #fff;
  font-weight: 600;
  margin-top: 8px;
}

/* Modal preview (HTML) */
.preview-modal { display:flex; flex-direction:column; width:100%; height:100%; background:#fff; }
.preview-header { display:flex; justify-content:space-between; align-items:center; padding:12px 12px 8px; border-bottom:1px solid #e6eef1; }
.preview-title { color:#0b3a43; font-weight:800; }
.preview-actions :deep(button) { margin-left:8px; }

/* HTML preview */
.native-preview { padding: 12px 4px 18px; }
.h1 { color:#0b3a43; font-size: 18px; margin: 6px 0 8px; font-weight: 800; }
.h2 { color:#0b3a43; font-size: 15px; margin: 16px 0 8px; font-weight: 700; }
.period { color:#0b3a43; margin-bottom: 12px; }
.tbl { width:100%; border-collapse: collapse; }
.tbl th, .tbl td { border:1px solid #cfd8dc; padding:8px; }
.tbl thead th { background:#e9f3f5; color:#0b3a43; }
.tbl .ar { text-align:right; }
.tbl .bold td { font-weight: 700; }
.ul { margin:0; padding-left: 20px; }
.advice { margin-top: 12px; }
.advice.ok { color:#2e7d32; }
.advice.bad { color:#c62828; }

</style>
