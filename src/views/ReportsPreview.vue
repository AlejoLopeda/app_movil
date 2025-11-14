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

      <!-- ✅ Toast estilo banner -->
      <ion-toast
        :is-open="toast.open"
        :message="toast.msg"
        :duration="2200"
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

function setDownloadEnabled(enabled) {
  window.dispatchEvent(new CustomEvent('report-can-download', { detail: { enabled: !!enabled } }))
}
async function onBottomDownload() { await downloadFromPreview() }

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

    showToast('Reporte descargado correctamente', 'success', 1200)
    requestAnimationFrame(() => router.replace('/reporte'))
  } catch (e) {
    console.error(e)
    err.value = e?.message || 'No se pudo guardar el PDF.'
    showToast('No se pudo descargar el reporte', 'error')
  }
}
</script>

<style scoped src="@/theme/Report.css"> </style>
