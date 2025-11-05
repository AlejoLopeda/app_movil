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
              GENERAR (DÍA)
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
              GENERAR (RANGO)
            </ion-button>
            <ion-note v-if="!validWeek" color="danger" style="margin-top:-6px">El rango es inválido.</ion-note>
          </div>

          <!-- Mensual -->
          <div class="block">
            <h3>Mensual</h3>
            <ion-item lines="none">
              <ion-label position="stacked">Mes</ion-label>
              <!-- type="month" soportado en Chrome/Android; en iOS cae a text -->
              <ion-input type="month" v-model="month" placeholder="YYYY-MM" />
            </ion-item>
            <ion-button expand="block" class="btn" @click="genMonthly" :disabled="!validMonth || loading">
              GENERAR (MES)
            </ion-button>
            <ion-note v-if="!validMonth" color="danger" style="margin-top:-6px">Mes inválido.</ion-note>
          </div>

          <ion-note v-if="err" color="danger" style="display:block; margin-top:8px;">{{ err }}</ion-note>
        </div>
      </div>

      <ion-toast :is-open="toast.open" :message="toast.msg" :duration="2200" color="success" @didDismiss="toast.open=false"/>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonButton, IonNote, IonToast } from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import { getTotals } from '@/services/transactionsService'
import { downloadReportPdf } from '@/services/reportPdfService'

const loading = ref(false)
const err = ref('')
const toast = ref({ open: false, msg: '' })

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
  // ym = "YYYY-MM"
  const [y, m] = ym.split('-').map(n=>Number(n))
  const first = new Date(y, m-1, 1)
  const last  = new Date(y, m, 0)
  const toISO = (dt) => dt.toISOString().slice(0,10)
  return { from: toISO(first), to: toISO(last) }
}

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

async function generate({ kind, from, to, periodLabel }){
  loading.value = true
  err.value = ''
  try{
    const { incomes, expenses } = await getTotals({ from, to })
    // Descarga el PDF
    downloadReportPdf({ kind, periodLabel, from, to, incomes, expenses })
    toast.value = { open: true, msg: 'PDF generado.' }
  }catch(e){
    console.error(e)
    err.value = e?.message || 'No se pudo generar el reporte.'
  }finally{
    loading.value = false
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
</style>
