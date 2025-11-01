import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MAIN_ROUTES } from '@/constants/routes'

export function useBottomBar() {
    const route = useRoute()
    const router = useRouter()

    /* ===== Qué mostrar ===== */
    const isMainRoute = computed(() => MAIN_ROUTES.some(p => route.path.startsWith(p)))
    const isAddIncomePage = computed(() => route.path === '/ingresos/nuevo')
    const isAddExpensePage = computed(() => route.path === '/gastos/nuevo')
    const isAddReminderPage = computed(() => route.path === '/recordatorios/nuevo')
    const isEditReminderPage = computed(() => route.name === 'EditReminder')
    const isRemindersPage = computed(() => route.path === '/recordatorios')
    const isGoalsPage = computed(() => route.path === '/metas' || route.path.startsWith('/metas/'))
    const isProfilePage = computed(() => route.path.startsWith('/perfil'))

    // Listas del histórico
    const isHistoryPage = computed(() => route.path.startsWith('/historico'))
    const isHistoryListPage = computed(() => /\/historico\//.test(route.path))

    // Balance mensual ahora está en /balance
    const isMonthlyBothPage = computed(() => route.path === '/balance')
    const isMonthlyArea = computed(() =>
        route.path.startsWith('/ingresos') ||
        route.path.startsWith('/gastos') ||
        route.path.startsWith('/balance')
    )
    const isBalancePage = computed(() => route.path === '/balance')

    const isAddPage = computed(() =>
        isAddIncomePage.value || isAddExpensePage.value || isAddReminderPage.value || isEditReminderPage.value
    )

    const historyTab = computed(() => {
        if (route.path.startsWith('/historico/ingresos')) return 'income'
        if (route.path.startsWith('/historico/gastos')) return 'expense'
        if (route.path.startsWith('/historico/ambos')) return 'both'
        const q = String(route.query.tab || 'income')
        return q === 'expense' ? 'expense' : q === 'both' ? 'both' : 'income'
    })

    const activeTab = computed(() => {
        if (route.path.startsWith('/ingresos')) return 'ingresos'
        if (route.path.startsWith('/gastos')) return 'gastos'
        if (route.path.startsWith('/historico')) return 'historico' // listas
        if (route.path === '/balance') return 'balance' // landing de balance
        return ''
    })

    /* ===== /perfil: habilitar acción ===== */
    const canSaveEnabled = ref(false)

    function handleCanSave(ev) { canSaveEnabled.value = !!(ev && ev.detail && ev.detail.enabled) }
    onMounted(() => window.addEventListener('bottom-can-save', handleCanSave))
    onUnmounted(() => window.removeEventListener('bottom-can-save', handleCanSave))
    watch(isProfilePage, now => { if (!now) canSaveEnabled.value = false })

    /* ===== Feedback ===== */
    const toastOpen = ref(false)
    const toastMsg = ref('')

    function fail(msg = 'No se pudo abrir la sección. Intenta de nuevo.') {
        toastMsg.value = msg
        toastOpen.value = true
    }

    /* ===== Guard de navegación (optimizado) ===== */
    const isNavigating = ref(false)
    let navTimer = 0

    function withNavGuard(fn) {
        if (isNavigating.value) return
        isNavigating.value = true
        clearTimeout(navTimer)
        requestAnimationFrame(() => {
            try { fn() } catch (e) { fail() } finally { navTimer = setTimeout(() => { isNavigating.value = false }, 220) } // un poco más ágil
        })
    }

    /* ===== Helpers navegación ===== */
    function safeReplace(path) { if (route.path !== path) router.replace(path).catch(() => {}) }

    function safePush(path) { if (route.path !== path) router.push(path).catch(() => {}) }

    function go(path) { withNavGuard(() => safePush(path)) }

    function emitAccept() { Promise.resolve().then(() => window.dispatchEvent(new CustomEvent('bottom-accept'))) }

    function goDashboard() {
        withNavGuard(() => {
            Promise.resolve().then(() => window.dispatchEvent(new CustomEvent('bottom-back')))
            const target = (isAddReminderPage.value || isEditReminderPage.value) ? '/recordatorios' : '/balance'
            safeReplace(target)
        })
    }

    function goAddReminder() { withNavGuard(() => safePush('/recordatorios/nuevo')) }

    function goAddGoal() { withNavGuard(() => safePush('/metas/nueva')) }

    function goHistory() { withNavGuard(() => safePush('/historico/ambos')) }

    // Balance mensual
    function goMonthlyIncome() { withNavGuard(() => safeReplace('/ingresos')) }

    function goMonthlyExpense() { withNavGuard(() => safeReplace('/gastos')) }

    function goMonthlyBoth() { withNavGuard(() => safeReplace('/balance')) }

    // Volver a /balance (desde histórico)
    function goBalance() { withNavGuard(() => safeReplace('/balance')) }

    // Cambiar pestaña histórico (listas)
    function setHistoryTab(mode) {
        withNavGuard(() => {
            const target =
                mode === 'income' ? '/historico/ingresos' :
                mode === 'expense' ? '/historico/gastos' :
                '/historico/ambos'
            if (route.fullPath !== target) safeReplace(target)
        })
    }

    /* ===== Toggle de botones ===== */
    function goOrToggleIncome() {
        withNavGuard(() => {
            if (route.path.startsWith('/ingresos')) {
                safeReplace('/balance') // estaba en ingresos → vuelve a balance
            } else {
                safeReplace('/ingresos') // ir a ingresos
            }
        })
    }

    function goOrToggleExpense() {
        withNavGuard(() => {
            if (route.path.startsWith('/gastos')) {
                safeReplace('/balance') // estaba en gastos → vuelve a balance
            } else {
                safeReplace('/gastos') // ir a gastos
            }
        })
    }

    return {
        // estado
        isMainRoute,
        isAddPage,
        isProfilePage,
        isRemindersPage,
        isHistoryPage,
        isHistoryListPage,
        isMonthlyBothPage,
        isMonthlyArea,
        isBalancePage,
        isGoalsPage,
        historyTab,
        activeTab,
        canSaveEnabled,

        // navegación/acciones
        go,
        goDashboard,
        goAddReminder,
        goHistory,
        setHistoryTab,
        emitAccept,
        goMonthlyIncome,
        goMonthlyExpense,
        goMonthlyBoth,
        goBalance,
        goAddGoal,
        goOrToggleIncome,
        goOrToggleExpense,

        // feedback/ui
        toastOpen,
        toastMsg,
        isNavigating,
    }
}