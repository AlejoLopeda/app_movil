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
            <ion-item lines="none">
              <ion-label position="stacked">Fecha</ion-label>
              <ion-input type="date" v-model="day" />
            </ion-item>
            <ion-button expand="block" class="btn" @click="genDaily" :disabled="loading">
              PREVISUALIZAR (DÍA)
            </ion-button>
          </div>

          <!-- Semanal / Rango -->
          <div class="block">
            <h3>Semanal</h3>
            <div class="row">
              <ion-item lines="none" class="col">
                <ion-label position="stacked">Desde</ion-label>
                <ion-input type="date" v-model="weekFrom" />
              </ion-item>
              <ion-item lines="none" class="col">
                <ion-label position="stacked">Hasta</ion-label>
                <ion-input type="date" v-model="weekTo" />
              </ion-item>
            </div>
            <ion-button expand="block" class="btn" @click="genWeekly" :disabled="!validWeek || loading">
              PREVISUALIZAR (RANGO)
            </ion-button>
            <ion-note v-if="!validWeek" color="danger" style="margin-top:-6px">El rango es inválido.</ion-note>
          </div>

          <!-- Mensual -->
          <div class="block">
            <h3>Mensual</h3>
            <ion-item lines="none">
              <ion-label position="stacked">Mes</ion-label>
              <ion-input type="month" v-model="month" placeholder="YYYY-MM" />
            </ion-item>
            <ion-button expand="block" class="btn" @click="genMonthly" :disabled="!validMonth || loading">
              PREVISUALIZAR (MES)
            </ion-button>
            <ion-note v-if="!validMonth" color="danger" style="margin-top:-6px">Mes inválido.</ion-note>
          </div>

          <ion-note v-if="err" color="danger" style="display:block; margin-top:8px;">{{ err }}</ion-note>
        </div>
      </div>

      <ion-toast :is-open="toast.open" :message="toast.msg" :duration="2200" color="success" @didDismiss="toast.open=false"/>

      <!-- ========== PREVISUALIZACIÓN ========== -->
      <ion-modal :is-open="previewOpen" @didDismiss="closePreview">
        <div class="preview-modal">
          <div class="preview-header">
            <h3>{{ modalTitle }}</h3>
            <div class="spacer"></div>
            <ion-button size="small" fill="outline" @click="downloadFromPreview" :disabled="loading">
              {{ isNative ? 'Guardar como PDF' : 'Descargar PDF' }}
            </ion-button>
            <ion-button size="small" fill="solid" @click="closePreview">Cerrar</ion-button>
          </div>

          <!-- Web: PDF real embebido -->
          <iframe v-if="!isNative" class="pdf-frame" :src="previewSrc" title="Vista previa PDF"></iframe>

          <!-- Nativo: HTML preview semánticamente equivalente -->
          <div v-else class="native-preview">
            <h4 class="h1">REPORTE {{ currentKind }}</h4>
            <div class="period">Período: {{ periodLabel }}</div>

            <table class="tbl">
              <thead><tr><th>Concepto</th><th class="ar">Valor</th></tr></thead>
              <tbody>
                <tr><td>Ingresos</td><td class="ar">{{ money(incomes) }}</td></tr>
                <tr><td>Gastos</td><td class="ar">{{ money(expenses) }}</td></tr>
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

            <p :class="['advice', balance >= 0 ? 'ok' : 'bad']">{{ adviceText }}</p>
          </div>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Capacitor } from '@capacitor/core'
import {
  IonPage, IonContent, IonItem, IonLabel, IonInput, IonButton, IonNote, IonToast, IonModal
} from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import { getTotals } from '@/services/transactionsService'
import {
  buildReportDoc, makeDataUrl, downloadWeb, saveNative, makeFileName
} from '@/services/reportPdfService'

const loading = ref(false)
const err = ref('')
const toast = ref({ open: false, msg: '' })

const isNative = Capacitor.isNativePlatform()

// ====== Diario ======
const todayISO = new Date().toISOString().slice(0, 10)
const day = ref(todayISO)

// ====== Semanal (rango) ======
const weekFrom = ref(todayISO)
const weekTo   = ref(todayISO)
const validWeek = computed(() => !!weekFrom.value && !!weekTo.value && weekFrom.value <= weekTo.value)

// ====== Mensual ======
const month = ref(todayISO.slice(0,7)) // "YYYY-MM"
const validMonth = computed(() => /^\d{4}-\d{2}$/.test(month.value || ''))

function humanRange (from, to) {
  const [y1,m1,d1] = from.split('-'); const [y2,m2,d2] = to.split('-')
  return `${d1}/${m1}/${y1} – ${d2}/${m2}/${y2}`
}
function humanDay (d) {
  const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`
}
function monthBounds (ym) {
  const [y, m] = ym.split('-').map(n=>Number(n))
  const first = new Date(y, m-1, 1)
  const last  = new Date(y, m, 0)
  const toISO = (dt) => dt.toISOString().slice(0,10)
  return { from: toISO(first), to: toISO(last) }
}

// ====== Estado de previsualización ======
const previewOpen  = ref(false)
const previewSrc   = ref('')  // solo web (data URL)
const currentDoc   = ref(null)
const currentKind  = ref('')  // DIARIO/SEMANAL/MENSUAL
const periodLabel  = ref('')
const modalTitle   = computed(() => `Vista previa – ${currentKind.value}`)

// Datos usados en preview nativa (HTML)
const incomes = ref(0)
const expenses = ref(0)
const balance = computed(() => (incomes.value || 0) - (expenses.value || 0))
const nf = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const money = v => nf.format(v || 0)
const balanceStatus = computed(() =>
  balance.value > 0 ? 'SALDO POSITIVO' :
  balance.value < 0 ? 'SALDO NEGATIVO' : 'SALDO NEUTRO'
)
const adviceText = computed(() =>
  balance.value > 0
    ? '¡Bien! Mantén el control: considera ahorrar un % de tu excedente.'
    : balance.value < 0
      ? 'Atención: revisa tus gastos y fija límites para equilibrar tus cuentas.'
      : 'Vas justo. Un pequeño ajuste en gastos o un ingreso extra mejorará tu balance.'
)

function closePreview(){ previewOpen.value = false; previewSrc.value = ''; currentDoc.value = null }

// ====== Generate handlers ======
async function genDaily(){
  await generate({ kind:'DIARIO', from: day.value, to: day.value, periodLabel: humanDay(day.value) })
}
async function genWeekly(){
  if (!validWeek.value) return
  await generate({ kind:'SEMANAL', from: weekFrom.value, to: weekTo.value, periodLabel: humanRange(weekFrom.value, weekTo.value) })
}
async function genMonthly(){
  if (!validMonth.value) return
  const { from, to } = monthBounds(month.value)
  const [y, m] = month.value.split('-')
  const monthName = new Date(Number(y), Number(m)-1, 1).toLocaleString('es-CO', { month: 'long', year: 'numeric' })
  await generate({ kind:'MENSUAL', from, to, periodLabel: monthName.charAt(0).toUpperCase() + monthName.slice(1) })
}

async function generate({ kind, from, to, periodLabel: pLabel }){
  loading.value = true
  err.value = ''
  try{
    const totals = await getTotals({ from, to })
    const doc = buildReportDoc({ kind, periodLabel: pLabel, from, to, ...totals })

    currentDoc.value  = doc
    currentKind.value = kind
    periodLabel.value = pLabel
    incomes.value  = totals.incomes
    expenses.value = totals.expenses

    if (!isNative) {
      // Web: data URL para embeber en iframe
      previewSrc.value = await makeDataUrl(doc)
    }

    previewOpen.value = true
  }catch(e){
    console.error(e)
    err.value = e?.message || 'No se pudo generar el reporte.'
  }finally{
    loading.value = false
  }
}

async function downloadFromPreview(){
  if (!currentDoc.value) return
  const name = makeFileName(currentKind.value)
  try{
    if (isNative) {
      await saveNative(currentDoc.value, name)
      toast.value = { open: true, msg: 'PDF guardado.' }
    } else {
      downloadWeb(currentDoc.value, name)
    }
  }catch(e){
    console.error(e)
    err.value = e?.message || 'No se pudo guardar/descargar el reporte.'
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
.title {
  margin: 6px 0 12px;
  color: #0b3a43;
  font-weight: 800;
  font-size: 20px;
  text-align: center;
}
.block { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #d0e3e6; }
.block h3 { margin: 0 0 6px; color: #0b3a43; font-weight: 700; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.col { --padding-start: 0; }
.btn { --background: #0b3a43; margin-top: 8px; }

/* Modal */
.preview-modal { padding: 12px; display: flex; flex-direction: column; height: 100%; }
.preview-header { display: flex; align-items: center; gap: 8px; }
.preview-header .spacer { flex: 1; }
.pdf-frame { width: 100%; height: calc(100vh - 110px); border: none; }

/* Preview nativo (HTML) */
.native-preview { padding: 8px 2px 16px; }
.h1 { color:#0b3a43; font-size: 18px; margin: 6px 0 8px; }
.h2 { color:#0b3a43; font-size: 15px; margin: 16px 0 8px; }
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

