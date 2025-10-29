import { createRouter, createWebHistory } from '@ionic/vue-router'
import AuthLoginPage from '@/views/AuthLoginPage.vue'
import AuthEmailPage from '@/views/AuthEmailPage.vue'
import Inicialmonto from '@/views/InicialMontoPage.vue'
import Dashboard from '@/views/Dashboard.vue'
import AddIncomePage from '@/views/AddIncomePage.vue'
import AddExpensePage from '@/views/AddExpensePage.vue'
import RecordatoriosPage from '@/views/RecordatoriosPage.vue'
import AddReminderPage from '@/views/AddReminderPage.vue'
import TermsPage from '@/views/TermsPage.vue'
import EditReminderPage from '@/views/EditReminderPage.vue'
import MonthlyIncomesPage from '@/views/MonthlyIncomesPage.vue'
import MonthlyExpensesPage from '@/views/MonthlyExpensesPage.vue'
import MonthlyBalancePage from '@/views/MonthlyBalancePage.vue'
import HistoryIncomePage from '../views/HistoryIncomePage.vue'
import HistoryExpensePage from '../views/HistoryExpensePage.vue'
import HistoryBothPage from '../views/HistoryBothPage.vue'
import ProfilePage from '../views/ProfilePage.vue'
import GoalsPage from '@/views/GoalsPage.vue'
import GoalCreatePage from '@/views/GoalCreatePage.vue'
import GoalEditPage from '@/views/GoalEditPage.vue'
import GoalDeleteConfirmPage from '@/views/GoalDeleteConfirmPage.vue'
import { fetchInitialAmount } from '@/services/initialAmountService.js'
import { useAuth } from '@/composables/useAuth.js'


const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/metas',
    name: 'Goals',
    component: GoalsPage,
    meta: { requiresAuth: true, title: 'Metas' }
  },
  {
    path: '/metas/nueva',
    name: 'GoalCreate',
    component: GoalCreatePage,
    meta: { requiresAuth: true, title: 'Crear Meta' }
  },
  {
    path: '/metas/:id/editar',
    name: 'GoalEdit',
    component: GoalEditPage,
    meta: { requiresAuth: true, title: 'Editar Meta' }
  },
  {
    path: '/metas/:id/eliminar',
    name: 'GoalDelete',
    component: GoalDeleteConfirmPage,
    meta: { requiresAuth: true, title: 'Eliminar Meta' }
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
  },
  {
    path: '/perfil',
    name: 'Profile',
    component: ProfilePage,
    meta: {
      requiresAuth: true,
      title: 'Perfil'
          }
  },
  {
    path: '/recordatorios/:id/editar',
    name: 'EditReminder',
    component: EditReminderPage,
    meta: {
      requiresAuth: true,
      title: 'Editar Recordatorio'
    }
  },
  {
    path: '/terminos',
    name: 'Terms',
    component: TermsPage,
    meta: {
      title: 'Términos y Condiciones'
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
