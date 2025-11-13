// src/composables/useReports.js
import { ref } from 'vue'
import { exportMovementsPDF } from '@/services/reportPdfService'

export function useReports() {
  const loading = ref(false)
  const err = ref('')
  const lastFile = ref('') // url (web) o uri (nativo)

  /**
   * movements: array de movimientos (ver tipo en el servicio)
   * period: 'diario' | 'semanal' | 'mensual'
   * kind: 'todos' | 'ingresos' | 'gastos'
   * anchorDate: Date|string (opcional, default hoy)
   * logoDataUrl: base64 opcional
   */
  async function downloadReport({ movements, period, kind='todos', anchorDate, logoDataUrl }) {
    loading.value = true
    err.value = ''
    try {
      lastFile.value = await exportMovementsPDF({ movements, period, kind, anchorDate, logoDataUrl })
      return lastFile.value
    } catch (e) {
      err.value = e?.message || 'No se pudo generar el PDF'
      return ''
    } finally {
      loading.value = false
    }
  }

  return { loading, err, lastFile, downloadReport }
}
