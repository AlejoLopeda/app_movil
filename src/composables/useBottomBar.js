import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MAIN_ROUTES } from '@/constants/routes'

/** Handlers opcionales para ACEPTAR / VOLVER (sin eventos globales) */
const acceptHandler = ref(null)
const backHandler   = ref(null)

export function useBottomBar() {
  const route  = useRoute()
  const router = useRouter()

  /* ===== Qué mostrar ===== */
  const isMainRoute       = computed(() => MAIN_ROUTES.some(p => route.path.startsWith(p)))
  const isAddIncomePage   = computed(() => route.path === '/ingresos/nuevo')
  const isAddExpensePage  = computed(() => route.path === '/gastos/nuevo')
  const isAddReminderPage = computed(() => route.path === '/recordatorios/nuevo')
  const isEditReminderPage= computed(() => route.name === 'EditReminder')
  const isRemindersPage   = computed(() => route.path === '/recordatorios')
  const isGoalsPage       = computed(() => route.path === '/metas' || route.path.startsWith('/metas/'))
  const isGoalCreatePage  = computed(() => route.path === '/metas/nueva')
  const isGoalEditPage    = computed(() => route.name === 'GoalEdit')
  const isProfilePage     = computed(() => route.path.startsWith('/perfil'))

  // ===== Reportes
  const isReportRootPage    = computed(() => route.path === '/reporte')
  const isReportPreviewPage = computed(() => route.path.startsWith('/reporte/previsualizacion'))
  const isReportPage        = computed(() => isReportRootPage.value || isReportPreviewPage.value)

  // Listas histórico
  const isHistoryPage     = computed(() => route.path.startsWith('/historico'))
  const isHistoryListPage = computed(() => /\/historico\//.test(route.path))

  // Balance mensual está en /balance
  const isMonthlyBothPage = computed(() => route.path === '/balance')
  const isMonthlyArea     = computed(() =>
    route.path.startsWith('/ingresos') ||
    route.path.startsWith('/gastos')   ||
    route.path.startsWith('/balance')
  )
  const isBalancePage     = computed(() => route.path === '/balance')

  const isAddPage = computed(() =>
    isAddIncomePage.value || isAddExpensePage.value || isAddReminderPage.value || isEditReminderPage.value
  )

  const historyTab = computed(() => {
    if (route.path.startsWith('/historico/ingresos')) return 'income'
    if (route.path.startsWith('/historico/gastos'))   return 'expense'
    if (route.path.startsWith('/historico/ambos'))    return 'both'
    const q = String(route.query.tab || 'income')
    return q === 'expense' ? 'expense' : q === 'both' ? 'both' : 'income'
  })

  const activeTab = computed(() => {
    if (route.path.startsWith('/ingresos'))  return 'ingresos'
    if (route.path.startsWith('/gastos'))    return 'gastos'
    if (route.path.startsWith('/historico')) return 'historico'
    if (route.path === '/balance')           return 'balance'
    return ''
  })

  /* ===== /perfil: habilitar acción ===== */
  const canSaveEnabled = ref(false)
  function handleCanSave(ev){ canSaveEnabled.value = !!(ev && ev.detail && ev.detail.enabled) }
  onMounted(() => window.addEventListener('bottom-can-save', handleCanSave))
  onUnmounted(() => window.removeEventListener('bottom-can-save', handleCanSave))
  const canSaveContextActive = computed(() => isProfilePage.value || isEditReminderPage.value || isGoalEditPage.value)
  watch(canSaveContextActive, active => {
    if (!active) canSaveEnabled.value = false
  })
  watch([isEditReminderPage, isGoalEditPage], ([editReminder, editGoal]) => {
    if (editReminder || editGoal) canSaveEnabled.value = false
  })

  /* ===== /reporte/previsualizacion: habilitar DESCARGAR ===== */
  const canDownloadEnabled = ref(false)
  function handleCanDownload(ev){ canDownloadEnabled.value = !!(ev && ev.detail && ev.detail.enabled) }
  onMounted(() => window.addEventListener('report-can-download', handleCanDownload))
  onUnmounted(() => window.removeEventListener('report-can-download', handleCanDownload))
  watch(isReportPreviewPage, now => { if (!now) canDownloadEnabled.value = false })

  /* ===== Feedback ===== */
  const toastOpen = ref(false)
  const toastMsg  = ref('')
  function fail(msg = 'No se pudo abrir la sección. Intenta de nuevo.'){
    toastMsg.value  = msg
    toastOpen.value = true
  }

  /* ===== Guard / navegación optimizada ===== */
  const isNavigating = ref(false)
  let lastTapTs = 0
  let clearBusyTimer = 0
  let removeAfterEach = null

  function setBusy(v){
    isNavigating.value = v
    clearTimeout(clearBusyTimer)
    if (!v) return
    clearBusyTimer = setTimeout(() => { isNavigating.value = false }, 250)
  }

  onMounted(() => {
    removeAfterEach = router.afterEach(() => {
      isNavigating.value = false
      clearTimeout(clearBusyTimer)
    })
  })
  onUnmounted(() => {
    if (removeAfterEach) removeAfterEach()
  })

  function throttled(){ 
    const now = performance.now()
    if (now - lastTapTs < 150) return true
    lastTapTs = now
    return false
  }

  async function navigate(target, { replace = false } = {}){
    if (!target) return
    if (throttled()) return
    if (route.fullPath === target) return
    if (isNavigating.value) return
    setBusy(true)
    try {
      if (replace) await router.replace(target)
      else         await router.push(target)
    } catch (e) {
      fail()
    } finally {
      setBusy(false)
    }
  }

  /* ===== Handlers para aceptar/volver (sin eventos globales) ===== */
  function setAcceptHandler(fn){
    acceptHandler.value = typeof fn === 'function' ? fn : null
  }
  function setBackHandler(fn){
    backHandler.value = typeof fn === 'function' ? fn : null
  }

  /* ===== Helpers ===== */
  function go(path){ navigate(path, { replace:false }) }

  // 👉 Primero intenta usar handler, si no, dispara evento global (para vistas viejas)
  function emitAccept(){
    if (acceptHandler.value) {
      acceptHandler.value()
      return
    }
    Promise.resolve().then(() =>
      window.dispatchEvent(new CustomEvent('bottom-accept'))
    )
  }

  function emitDownload(){
    Promise.resolve().then(() => window.dispatchEvent(new CustomEvent('bottom-download')))
  }

  // PREVISUALIZAR (para /reporte)
  function emitPreview(){
    Promise.resolve().then(() => window.dispatchEvent(new CustomEvent('bottom-preview')))
  }

  // ✅ Volver: preview -> /reporte, /reporte -> /balance, /recordatorios/nuevo -> /recordatorios, etc.
  function goDashboard(){
    let target = '/balance'
    if (isAddReminderPage.value || isEditReminderPage.value) {
      target = '/recordatorios'
    } else if (isReportPreviewPage.value) {
      target = '/reporte'
    } else if (isReportRootPage.value) {
      target = '/balance'
    } else if (isGoalEditPage.value) {
      target = '/metas'
    }

    // Handler de back primero (por si alguien quiere limpiar algo)
    if (backHandler.value) {
      backHandler.value()
    }

    navigate(target, { replace:true })
    Promise.resolve().then(() => globalThis.dispatchEvent(new CustomEvent('bottom-back')))
  }

  function goAddReminder(){ navigate('/recordatorios/nuevo') }
  function goAddGoal(){ navigate('/metas/nueva') }
  function goGoalsPanel(){
    navigate('/metas', { replace:true })
    Promise.resolve().then(() => globalThis.dispatchEvent(new CustomEvent('bottom-back')))
  }
  function goHistory(){ navigate('/historico/ambos') }

  function goMonthlyIncome(){ navigate('/ingresos',  { replace:true }) }
  function goMonthlyExpense(){ navigate('/gastos',   { replace:true }) }
  function goMonthlyBoth(){ navigate('/balance',     { replace:true }) }
  function goBalance(){ navigate('/balance', { replace:true }) }

  function setHistoryTab(mode){
    const target =
      mode === 'income'  ? '/historico/ingresos' :
      mode === 'expense' ? '/historico/gastos'   :
                            '/historico/ambos'
    if (route.fullPath !== target) navigate(target, { replace:true })
  }

  function goOrToggleIncome(){
    if (route.path.startsWith('/ingresos')) navigate('/balance', { replace:true })
    else                                    navigate('/ingresos', { replace:true })
  }
  function goOrToggleExpense(){
    if (route.path.startsWith('/gastos')) navigate('/balance', { replace:true })
    else                                  navigate('/gastos', { replace:true })
  }

  return {
    // estado
    isMainRoute, isAddPage, isProfilePage, isRemindersPage, isHistoryPage,
    isHistoryListPage, isMonthlyBothPage, isMonthlyArea, isBalancePage, isGoalsPage, isGoalCreatePage, isGoalEditPage,
    isReportPage, isReportRootPage, isReportPreviewPage,
    historyTab, activeTab, canSaveEnabled, canDownloadEnabled,

    // navegación/acciones
    go, goDashboard, goAddReminder, goHistory, setHistoryTab,
    emitAccept, emitDownload, emitPreview,
    goMonthlyIncome, goMonthlyExpense, goMonthlyBoth, goBalance,
    goAddGoal, goGoalsPanel, goOrToggleIncome, goOrToggleExpense, emitPreview,

    // feedback/ui
    toastOpen, toastMsg, isNavigating,
  }
}
