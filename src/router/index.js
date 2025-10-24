import { createRouter, createWebHistory } from '@ionic/vue-router'
import AuthLoginPage from '@/views/AuthLoginPage.vue'
import AuthEmailPage from '@/views/AuthEmailPage.vue'
import Inicialmonto from '@/views/InicialMontoPage.vue'
import Dashboard from '@/views/Dashboard.vue'
import AddIncomePage from '@/views/AddIncomePage.vue'
import AddExpensePage from '@/views/AddExpensePage.vue'
import RecordatoriosPage from '@/views/RecordatoriosPage.vue'
import AddReminderPage from '@/views/AddReminderPage.vue'
import MonthlyIncomesPage from '@/views/MonthlyIncomesPage.vue'
import MonthlyExpensesPage from '@/views/MonthlyExpensesPage.vue'
import MonthlyBalancePage from '@/views/MonthlyBalancePage.vue'
import HistoryIncomePage from '../views/HistoryIncomePage.vue'
import HistoryExpensePage from '../views/HistoryExpensePage.vue'
import HistoryBothPage from '../views/HistoryBothPage.vue'
import { fetchInitialAmount } from '@/services/initialAmountService.js'
import { useAuth } from '@/composables/useAuth.js'


const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: AuthLoginPage,
    meta: {
      guestOnly: true
    }
  },
  {
    path: '/registro',
    name: 'Register',
    component: AuthEmailPage,
    meta: {
      guestOnly: true
    }
  },
  {
    path: '/monto',
    name: 'Monto',
    component: Inicialmonto,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      requiresAuth: true,
      title: 'Inicio'
    }
  },
  {
    path: '/ingresos',
    name: 'MonthlyIncomes',
    component: MonthlyIncomesPage,
    meta: {
      requiresAuth: true,
      requiresInitialAmount: true,
      title: 'Ingresos'
    }
  },
  {
    path: '/ingresos/nuevo',
    name: 'AddIncome',
    component: AddIncomePage,
    meta: {
      requiresAuth: true,
      requiresInitialAmount: true,
      title: 'Anadir ingreso'
    }
  },
  {
    path: '/gastos',
    name: 'MonthlyExpenses',
    component: MonthlyExpensesPage,
    meta: {
      requiresAuth: true,
      requiresInitialAmount: true,
      title: 'Gastos'
    }
  },
  {
    path: '/gastos/nuevo',
    name: 'AddExpense',
    component: AddExpensePage,
    meta: {
      requiresAuth: true,
      requiresInitialAmount: true,
      title: 'Anadir gasto'
    }
  },
  {
    path: '/historico/ingresos',
    name: 'HistoryIncome',
    component: HistoryIncomePage,
    meta: {
      requiresAuth: true,
      requiresInitialAmount: true,
      title: 'Historial Ingresos'
    }
  },
  {
    path: '/historico/gastos',
    name: 'HistoryExpense',
    component: HistoryExpensePage,
    meta: {
      requiresAuth: true,
      requiresInitialAmount: true,
      title: 'Historial Gastos'
    }
  },
  {
    path: '/historico/ambos',
    name: 'HistoryBoth',
    component: HistoryBothPage,
    meta: {
      requiresAuth: true,
      requiresInitialAmount: true,
      title: 'Historial Ambos'
    }
  },
  {
    path: '/recordatorios',
    name: 'Recordatorios',
    component: RecordatoriosPage,
    meta: {
      requiresAuth: true,
      title: 'Recordatorios'
    }
  },
  {
    path: '/historico',
    name: 'MonthlyBalance',
    component: MonthlyBalancePage,
    meta: {
      requiresAuth: true,
      requiresInitialAmount: true,
      title: 'Balance'
    }
  },
  {
    path: '/recordatorios/nuevo',
    name: 'AddReminder',
    component: AddReminderPage,
    meta: {
      requiresAuth: true,
      title: 'Añadir Recordatorio'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  const { isAuthenticated, restoreSession } = useAuth()
  let initialAmountLoaded = false
  let initialAmountData

  const loadInitialAmount = async () => {
    if (initialAmountLoaded) return initialAmountData
    initialAmountLoaded = true
    initialAmountData = await fetchInitialAmount().catch(() => null)
    return initialAmountData
  }

  if (!isAuthenticated.value) {
    await restoreSession()
  }

  // Bloquear rutas privadas si no hay sesión
  if (to.meta?.requiresAuth && !isAuthenticated.value) {
    const redirect = to.fullPath && to.fullPath !== '/' ? to.fullPath : undefined
    return {
      name: 'Login',
      query: redirect ? { redirect } : undefined
    }
  }

  // 👇 Usuario autenticado intentando ir a login/registro
  if (to.meta?.guestOnly && isAuthenticated.value) {
    const d = await loadInitialAmount()
    if (d?.initial_set_at) {
      return { name: 'Dashboard' }  // ya tiene monto → Dashboard
    } else {
      return { name: 'Monto' }      // no tiene monto → Monto
    }
  }

  // 👇 Usuario intenta ir manualmente a /monto pero ya tiene monto
  if (to.name === 'Monto' && isAuthenticated.value) {
    const d = await loadInitialAmount()
    if (d?.initial_set_at) {
      return { name: 'Dashboard' }
    }
  }

  if (to.meta?.requiresInitialAmount) {
    const d = await loadInitialAmount()
    if (!d?.initial_set_at) {
      const redirect = to.fullPath && to.fullPath !== '/' ? to.fullPath : undefined
      return {
        name: 'Monto',
        query: redirect ? { redirect } : undefined
      }
    }
  }

  return true
})

export default router
