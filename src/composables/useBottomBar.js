import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MAIN_ROUTES } from '@/constants/routes'

export function useBottomBar() {
  const route = useRoute()
  const router = useRouter()

  /* ===== Qué mostrar en la barra ===== */
  const isMainRoute = computed(() => MAIN_ROUTES.some(p => route.path.startsWith(p)))

  const isAddIncomePage    = computed(() => route.path === '/ingresos/nuevo')
  const isAddExpensePage   = computed(() => route.path === '/gastos/nuevo')
  const isAddReminderPage  = computed(() => route.path === '/recordatorios/nuevo')
  const isEditReminderPage = computed(() => route.name === 'EditReminder')
  const isRemindersPage    = computed(() => route.path === '/recordatorios')
  const isProfilePage      = computed(() => route.path.startsWith('/perfil'))
  const isHistoryPage      = computed(() => route.path.startsWith('/historico'))

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
    return ''
  })

  /* ===== Habilitar botón ACEPTAR/ACTUALIZAR desde /perfil ===== */
  const canSaveEnabled = ref(false)
  function handleCanSave(ev) {
    canSaveEnabled.value = !!ev?.detail?.enabled
  }
  onMounted(() => window.addEventListener('bottom-can-save', handleCanSave))
  onUnmounted(() => window.removeEventListener('bottom-can-save', handleCanSave))
  watch(isProfilePage, now => { if (!now) canSaveEnabled.value = false })

  /* ===== Feedback/errores ===== */
  const toastOpen = ref(false)
  const toastMsg  = ref('')
  function fail(msg = 'No se pudo abrir la sección. Intenta de nuevo.') {
    toastMsg.value  = msg
    toastOpen.value = true
  }

  /* ===== Optimizaciones de navegación ===== */
  const isNavigating = ref(false)
  let navTimer = 0

  function withNavGuard(fn) {
    if (isNavigating.value) return
    isNavigating.value = true
    clearTimeout(navTimer)
    try {
      requestAnimationFrame(() => {
        try { fn() } catch { fail() }
      })
    } finally {
      navTimer = setTimeout(() => { isNavigating.value = false }, 320)
    }
  }

  function go(path) {
    withNavGuard(() => {
      if (route.path !== path) router.push(path).catch(() => {})
    })
  }

  function emitAccept() {
    Promise.resolve().then(() => {
      window.dispatchEvent(new CustomEvent('bottom-accept'))
    })
  }

  function goDashboard() {
    withNavGuard(() => {
      Promise.resolve().then(() =>
        window.dispatchEvent(new CustomEvent('bottom-back'))
      )
      const target = (isAddReminderPage.value || isEditReminderPage.value) ? '/recordatorios' : '/historico'
      if (route.path !== target) router.replace(target).catch(() => {})
    })
  }

  function goAddReminder() {
    withNavGuard(() => {
      const target = '/recordatorios/nuevo'
      if (route.path !== target) router.push(target).catch(() => {})
    })
  }

  function goHistory() {
    withNavGuard(() => {
      const target = '/historico/ingresos'
      if (route.path !== target) router.push(target).catch(() => {})
    })
  }

  function setHistoryTab(mode) {
    withNavGuard(() => {
      const target = mode === 'income'
        ? '/historico/ingresos'
        : mode === 'expense'
          ? '/historico/gastos'
          : '/historico/ambos'
      if (route.fullPath !== target) router.replace(target).catch(() => {})
    })
  }

  return {
    // estado de UI
    isMainRoute, isAddPage, isProfilePage, isRemindersPage, isHistoryPage,
    historyTab, activeTab, canSaveEnabled,

    // navegación/acciones
    go, goDashboard, goAddReminder, goHistory, setHistoryTab, emitAccept,

    // feedback
    toastOpen, toastMsg,

    // expuesto para la vista
    isNavigating,
  }
}


