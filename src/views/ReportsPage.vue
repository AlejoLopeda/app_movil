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

      <!-- ===== MODAL PREVIEW ===== -->
      <ion-modal :is-open="previewOpen" @didDismiss="closePreview">
        <div class="preview-modal">
          <div class="preview-header">
            <div class="preview-title"><strong>Vista previa – {{ previewTitle }}</strong></div>
            <div class="preview-actions">
              <ion-button size="small" fill="outline" @click="downloadCurrent" :disabled="downloading">
                {{ downloading ? 'GUARDANDO…' : 'DESCARGAR PDF' }}
              </ion-button>
              <ion-button size="small" @click="closePreview">CERRAR</ion-button>
            </div>
          </div>

          <div class="preview-body">
            <div v-if="previewLoading" class="preview-spinner">Cargando…</div>

            <!-- IFRAME para web / móviles que soporten PDF en WebView -->
            <iframe
              v-show="!previewLoading && previewMode === 'iframe'"
              class="preview-frame"
              :src="previewUrl"
              type="application/pdf"
              frameborder="0"
            ></iframe>

            <!-- Fallback para Android WebView: botón para abrir con visor nativo -->
            <div v-show="!previewLoading && previewMode === 'fallback'" class="fallback">
              <p>Tu dispositivo no puede mostrar PDFs dentro de la app.</p>
              <ion-button @click="openInSystemViewer" class="btn">ABRIR EN VISOR DEL SISTEMA</ion-button>
            </div>
          </div>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import {
  IonPage, IonContent, IonItem, IonLabel, IonInput, IonButton, IonNote, IonToast, IonModal
} from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

import AppTopBar from '@/components/AppTopBar.vue'
import { getTotals } from '@/services/transactionsService'
import { buildReportDoc, makePdfBlob, makePdfDataUrl, downloadReportPdf } from '@/services/reportPdfService'

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
const month = ref(todayISO.slice(0,7))
const validMonth = computed(() => /^\d{4}-\d{2}$/.test(month.value || ''))

function humanRange (from, to) {
  const [y1,m1,d1] = from.split('-'); const [y2,m2,d2] = to.split('-')
  return `${d1}/${m1}/${y1} – ${d2}/${m2}/${y2}`
}
function humanDay (d) { const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}` }
function monthBounds (ym) {
  const [y, m] = ym.split('-').map(n=>Number(n))
  const first = new Date(y, m-1, 1)
  const last  = new Date(y, m, 0)
  const toISO = (dt) => dt.toISOString().slice(0,10)
  return { from: toISO(first), to: toISO(last) }
}

/* ===== PREVIEW STATE ===== */
const previewOpen    = ref(false)
const previewLoading = ref(false)
const previewUrl     = ref('')      // data: o blob: para iframe
const previewBlob    = ref(null)    // Blob para guardar/compartir
const previewTitle   = ref('')      // DIARIO/SEMANAL/MENSUAL
const previewMode    = ref('iframe')// 'iframe' | 'fallback'
const downloading    = ref(false)

function revokePreview () {
  try { if (previewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(previewUrl.value) } catch {}
  previewUrl.value = ''
  previewBlob.value = null
  previewMode.value = 'iframe'
}
function closePreview () { revokePreview(); previewOpen.value = false }

/* ===== Handlers de generación (abre preview) ===== */
async function genDaily(){
  await openPreview({ kind:'DIARIO', from: day.value, to: day.value, periodLabel: humanDay(day.value) })
}
async function genWeekly(){
  if (!validWeek.value) return
  await openPreview({ kind:'SEMANAL', from: weekFrom.value, to: weekTo.value, periodLabel: humanRange(weekFrom.value, weekTo.value) })
}
async function genMonthly(){
  if (!validMonth.value) return
  const { from, to } = monthBounds(month.value)
  const [y, m] = month.value.split('-')
  const monthName = new Date(Number(y), Number(m)-1, 1).toLocaleString('es-CO', { month: 'long', year: 'numeric' })
  await openPreview({ kind:'MENSUAL', from, to, periodLabel: monthName.charAt(0).toUpperCase() + monthName.slice(1) })
}

async function openPreview({ kind, from, to, periodLabel }){
  loading.value = true
  err.value = ''
  revokePreview()
  previewOpen.value = true
  previewLoading.value = true
  previewTitle.value  = kind

  try{
    const { incomes, expenses } = await getTotals({ from, to })
    const doc = buildReportDoc({ kind, periodLabel, from, to, incomes, expenses })

    // 1) Intento DataURL (mejor compatibilidad en algunos WebViews)
    let url = ''
    try {
      url = await makePdfDataUrl(doc) // "data:application/pdf;base64,..."
    } catch {}
    // 2) Si falla, intento Blob URL
    if (!url) {
      const blob = await makePdfBlob(doc)
      previewBlob.value = blob
      url = URL.createObjectURL(blob)
    } else {
      // también guardo blob por si el usuario quiere descargar/compartir
      const b = await makePdfBlob(doc)
      previewBlob.value = b
    }

    previewUrl.value = url

    // Pequeña espera y verificación: si el WebView no renderiza PDF, vamos a fallback
    await nextTick()
    setTimeout(() => {
      // simple chequeo: si Android nativo, forzamos fallback porque muchos WebViews no soportan PDF
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        previewMode.value = 'fallback'
      } else {
        previewMode.value = 'iframe'
      }
      previewLoading.value = false
    }, 200)
  }catch(e){
    console.error(e)
    err.value = e?.message || 'No se pudo generar el reporte.'
    previewOpen.value = false
  }finally{
    loading.value = false
  }
}

/* ===== Abrir en visor del sistema (fallback Android/iOS) ===== */
async function openInSystemViewer () {
  try {
    if (!previewBlob.value) return
    const base64 = await blobToBase64(previewBlob.value) // "data:application/pdf;base64,AAA..."
    const b64 = base64.split(',')[1] || base64

    const filename = `preview-${Date.now()}.pdf`
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: b64,
      directory: Directory.Cache,
      encoding: Encoding.BASE64,
      recursive: true
    })
    await Share.share({
      files: [uri],
      title: 'Reporte (PDF)',
      dialogTitle: 'Abrir con…'
    })
  } catch (e) {
    console.error('openInSystemViewer error', e)
    toast.value = { open: true, msg: 'No se pudo abrir el visor del sistema' }
  }
}

/* ===== Descargar el PDF actual ===== */
async function downloadCurrent(){
  if (!previewBlob.value) return
  const slug =
    previewTitle.value === 'DIARIO'  ? 'reporte-diario' :
    previewTitle.value === 'SEMANAL' ? 'reporte-semanal' : 'reporte-mensual'
  const filename = `${slug}-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`

  // WEB → descarga directa
  if (!Capacitor.isNativePlatform()){
    const a = document.createElement('a')
    a.href = previewUrl.value
    a.download = filename
    document.body.appendChild(a); a.click(); a.remove()
    return
  }

  // NATIVO → guardar en Documents (visible para compartir más tarde)
  try{
    downloading.value = true
    const base64 = await blobToBase64(previewBlob.value)
    const b64 = base64.split(',')[1] || base64

    await Filesystem.writeFile({
      path: filename,
      data: b64,
      directory: Directory.Documents,
      encoding: Encoding.BASE64,
      recursive: true
    })
    toast.value = { open: true, msg: 'PDF guardado en Documentos.' }
  }catch(e){
    console.error('save pdf error', e)
    toast.value = { open: true, msg: 'No se pudo guardar el PDF' }
  }finally{
    downloading.value = false
  }
}

function blobToBase64 (blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
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

/* Preview modal */
.preview-modal { display:flex; flex-direction:column; width:100%; height:100%; background:#fff; }
.preview-header {
  display:flex; justify-content:space-between; align-items:center;
  padding:12px 12px 8px; border-bottom:1px solid #e6eef1;
}
.preview-title { color:#0b3a43; font-weight:800; }
.preview-actions :deep(button) { margin-left:8px; }
.preview-body { padding:8px; height:100%; display:grid; }
.preview-frame {
  width:100%;
  height: calc(100vh - 160px);
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,.08);
  background:#f6f9fb;
}
.preview-spinner {
  display:grid; place-items:center;
  width:100%; height: calc(100vh - 160px);
  color:#0b3a43; font-weight:600;
}
.fallback {
  display:grid; place-items:center; gap:12px;
  width:100%; height: calc(100vh - 160px);
  color:#0b3a43;
}
</style>


