import { createRouter, createWebHistory } from '@ionic/vue-router'
import AuthLoginPage from '@/views/AuthLoginPage.vue'
import AuthEmailPage from '@/views/AuthEmailPage.vue'
import Inicialmonto from '@/views/InicialMontoPage.vue'
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

  if (to.meta?.requiresAuth && !isAuthenticated.value) {
    const redirect = to.fullPath && to.fullPath !== '/' ? to.fullPath : undefined
    return {
      name: 'Login',
      query: redirect ? { redirect } : undefined
    }
  }

  if (to.meta?.guestOnly && isAuthenticated.value) {
    return { name: 'Monto' }
  }

  return true
})

export default router
