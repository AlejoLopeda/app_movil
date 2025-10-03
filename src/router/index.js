import { createRouter, createWebHistory } from '@ionic/vue-router'
import AuthLoginPage from '@/views/AuthLoginPage.vue'
import AuthEmailPage from '@/views/AuthEmailPage.vue'
import Inicialmonto from '@/views/InicialMontoPage.vue'
import Dashboard from '@/views/Dashboard.vue'
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
    },
  },
  {
  path: '/dashboard',
  name: 'Dashboard',
  component: Dashboard,
  meta: {
    requiresAuth: true,
    title: 'Inicio'  
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  const { isAuthenticated, restoreSession } = useAuth()

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
    const d = await fetchInitialAmount().catch(() => null)
    if (d?.initial_set_at) {
      return { name: 'Dashboard' }  // ya tiene monto → Dashboard
    } else {
      return { name: 'Monto' }      // no tiene monto → Monto
    }
  }

  // 👇 Usuario intenta ir manualmente a /monto pero ya tiene monto
  if (to.name === 'Monto' && isAuthenticated.value) {
    const d = await fetchInitialAmount().catch(() => null)
    if (d?.initial_set_at) {
      return { name: 'Dashboard' }
    }
  }

  return true
})

export default router
