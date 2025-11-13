<!-- src/views/ReportePreview.vue -->
<template>
  <ion-page>
    <app-top-bar :title="'PREVISUALIZACIÓN'" />

    <ion-content class="preview-content" fullscreen>
      <div class="screen">
        <div class="card">
          <div class="head">
            <div class="title">
              <strong>REPORTE {{ currentKind }}</strong>
            </div>
            <div class="period">Período: {{ periodLabel }}</div>
          </div>

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

      <!-- ✅ Toast superior tipo banner -->
      <ion-toast
        :is-open="toast.open"
        :message="toast.msg"
        :duration="2200"
        position="top"
        :cssClass="['notice-toast', toastType]"
        @didDismiss="toast.open=false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonToast } from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import { getTotals } from '@/services/transactionsService'
import { buildReportDoc, saveNative, makeFileName } from '@/services/reportPdfService'

/* === Helpers bottom bar === */
function setDownloadEnabled(enabled) {
  window.dispatchEvent(new CustomEvent('report-can-download', { detail: { enabled: !!enabled } }))
}
async function onBottomDownload() {
  await downloadFromPreview()
}

const route = useRoute()
const router = useRouter()

const toast = ref({ open: false, msg: '' })
const toastType = ref('success')
const loading = ref(false)
const err = ref('')

const currentKind = ref('')
const fromISO = ref('')
const toISO = ref('')
const periodLabel = ref('')

function syncFromRoute() {
  const q = route.query || {}
  currentKind.value = String(q.kind ?? route.params.kind ?? '')
  fromISO.value = String(q.from ?? route.params.from ?? '')
  toISO.value = String(q.to ?? route.params.to ?? '')
  periodLabel.value = decodeURIComponent(String(q.label ?? route.params.label ?? ''))
}
syncFromRoute()

const incomes = ref(0)
const expenses = ref(0)
const balance = computed(() => Number(incomes.value || 0) - Number(expenses.value || 0))
const nf = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const money = (v) => nf.format(Number(v ?? 0))
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

function showToast(msg, type = 'success', autoCloseMs = 2200) {
  toastType.value = type
  toast.value = { open: true, msg }
  if (autoCloseMs > 0) setTimeout(() => (toast.value.open = false), autoCloseMs)
}

async function loadTotals() {
  if (!fromISO.value || !toISO.value) {
    incomes.value = 0
    expenses.value = 0
    return
  }
  loading.value = true
  err.value = ''
  try {
    const totals = await getTotals({ from: fromISO.value, to: toISO.value })
    incomes.value = Number(totals?.incomes ?? 0)
    expenses.value = Number(totals?.expenses ?? 0)
  } catch (e) {
    err.value = e?.message || 'No se pudo cargar la previsualización.'
    incomes.value = 0
    expenses.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try { document.activeElement?.blur?.() } catch (_) {}
  await loadTotals()
  setDownloadEnabled(true)
  window.addEventListener('bottom-download', onBottomDownload)
})
onUnmounted(() => {
  window.removeEventListener('bottom-download', onBottomDownload)
  setDownloadEnabled(false)
})
watch(() => route.fullPath, async () => {
  syncFromRoute()
  await loadTotals()
})

async function downloadFromPreview() {
  try {
    // Feedback rápido
    showToast('Descargando reporte…', 'success', 1200)
    await nextTick()

    const doc = buildReportDoc({
      kind: currentKind.value,
      periodLabel: periodLabel.value,
      from: fromISO.value,
      to: toISO.value,
      incomes: Number(incomes.value || 0),
      expenses: Number(expenses.value || 0)
    })

    await saveNative(doc, makeFileName(currentKind.value))

    // Confirmación y navegación inmediata (sin abrir visor nativo)
    showToast('Reporte descargado correctamente', 'success', 1200)
    requestAnimationFrame(() => router.replace('/reporte'))
  } catch (e) {
    console.error(e)
    err.value = e?.message || 'No se pudo guardar el PDF.'
    showToast('No se pudo descargar el reporte', 'error')
  }
}
</script>

<style scoped>
.preview-content {
  --background: #f5fbfc;
  overflow-y: hidden !important; /* 🚫 Sin scroll vertical */
}

.screen {
  padding: 16px;
  display: grid;
  place-content: start center; /* centra horizontal */
  min-height: 100%;
  width: 100%;
}

.card {
  width: 100%;
  max-width: clamp(320px, 92vw, 520px);
  margin: 8px auto 0;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 6px 18px rgba(0,0,0,.06);
  padding: 16px;
}

.head .title { margin: 6px 0 4px; color: #0b3a43; font-weight: 800; font-size: 18px; }
.period { color:#0b3a43; margin-bottom: 12px; }
.h2 { color:#0b3a43; font-size: 15px; margin: 16px 0 8px; font-weight: 700; }

.tbl { width:100%; border-collapse: collapse; }
.tbl th, .tbl td {
  border:1px solid #cfd8dc; padding:8px;
  color:#0b3a43;
  font-variant-numeric: tabular-nums;
}
.tbl thead th { background:#e9f3f5; }
.tbl .ar { text-align:right; }
.tbl .bold td { font-weight: 700; }

.ul { margin:0; padding-left: 20px; color: #0b3a43; }
.ul li { color: #0b3a43; line-height: 1.4; margin: 2px 0; }
.advice { margin-top: 12px; }
.advice.ok { color:#2e7d32; }
.advice.bad { color:#c62828; }

 /* ✅ Toast tipo banner superior */
.notice-toast {
  --background: #104e27;
  --color: #fff;
  --border-radius: 14px;
  --box-shadow: 0 10px 24px rgba(0,0,0,.18);
  --max-width: calc(100% - 24px);
  --width: auto;
  --start: 12px;
  --end: 12px;
  --top: calc(env(safe-area-inset-top, 0px) + 8px);
  font-weight: 600;
}
.notice-toast.error { --background: #7a1c1c; }
.notice-toast.success { --background: #104e27; }
</style>

